package com.smartsolar.app;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import java.util.*;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class GridOperatorDashboardActivity extends AppCompatActivity {

    private DatabaseHelper db;
    private final List<ApiClient.NodeDto> nodes = new ArrayList<>();
    private final List<ApiClient.ReservationDto> reservations = new ArrayList<>();
    private LinearLayout panelHubs, panelReservations, containerHubs, containerReservations;
    private Button btnTabHubs, btnTabReservations;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator);

        db = new DatabaseHelper(this);
        String[] user = db.getLocalUser();
        if (user == null) { logout(); return; }
        ((TextView) findViewById(R.id.tvWelcome)).setText("Operator " + user[2]);

        panelHubs = findViewById(R.id.panelHubs);
        panelReservations = findViewById(R.id.panelReservations);
        containerHubs = findViewById(R.id.containerHubs);
        containerReservations = findViewById(R.id.containerReservations);
        btnTabHubs = findViewById(R.id.btnTabHubs);
        btnTabReservations = findViewById(R.id.btnTabReservations);

        btnTabHubs.setOnClickListener(v -> showTab(true));
        btnTabReservations.setOnClickListener(v -> showTab(false));
        findViewById(R.id.btnScanQr).setOnClickListener(v -> initiateScan());
        findViewById(R.id.btnLogout).setOnClickListener(v -> logout());

        loadNodes();
        loadReservations();
    }

    private void showTab(boolean hubs) {
        panelHubs.setVisibility(hubs ? View.VISIBLE : View.GONE);
        panelReservations.setVisibility(hubs ? View.GONE : View.VISIBLE);
        btnTabHubs.setBackgroundTintList(ColorStateList.valueOf(
                ContextCompat.getColor(this, hubs ? R.color.brand_amber : R.color.chip_grey_bg)));
        btnTabReservations.setBackgroundTintList(ColorStateList.valueOf(
                ContextCompat.getColor(this, hubs ? R.color.chip_grey_bg : R.color.brand_amber)));
    }

    // ---------- HUBS + battery slot updates ----------

    private void loadNodes() {
        ApiClient.api().getNodes().enqueue(new Callback<List<ApiClient.NodeDto>>() {
            @Override public void onResponse(Call<List<ApiClient.NodeDto>> call, Response<List<ApiClient.NodeDto>> response) {
                nodes.clear();
                if (response.body() != null) nodes.addAll(response.body());
                renderHubs();
            }
            @Override public void onFailure(Call<List<ApiClient.NodeDto>> call, Throwable t) {
                Toast.makeText(GridOperatorDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void renderHubs() {
        containerHubs.removeAllViews();
        for (ApiClient.NodeDto n : nodes) containerHubs.addView(hubRow(n));
    }

    private View hubRow(ApiClient.NodeDto n) {
        androidx.cardview.widget.CardView card = Ui.card(this);
        LinearLayout box = Ui.col(this, 12);

        box.addView(Ui.text(this, n.name + (n.isActive ? "" : " (inactive)"), 16, R.color.brand_ink, true));
        box.addView(Ui.text(this, "Capacity: " + n.capacityKwh + " kWh • " + n.operatingSchedule,
                13, R.color.brand_muted, false));

        EditText etSlots = new EditText(this);
        etSlots.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        etSlots.setText(String.valueOf(n.availableBatterySlots));
        etSlots.setHint("Battery slots");
        box.addView(etSlots);

        Button save = new Button(this);
        save.setText("Update Battery Slots");
        save.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this, R.color.brand_green)));
        save.setTextColor(ContextCompat.getColor(this, R.color.brand_white));
        save.setOnClickListener(v -> {
            try {
                ApiClient.NodeDto updated = copyNode(n);
                updated.availableBatterySlots = Integer.parseInt(etSlots.getText().toString().trim());
                updateNode(n.id, updated);
            } catch (NumberFormatException e) {
                Toast.makeText(this, "Enter a valid number of slots", Toast.LENGTH_SHORT).show();
            }
        });
        box.addView(save);

        card.addView(box);
        return card;
    }

    private ApiClient.NodeDto copyNode(ApiClient.NodeDto n) {
        ApiClient.NodeDto c = new ApiClient.NodeDto();
        c.id = n.id; c.name = n.name; c.latitude = n.latitude; c.longitude = n.longitude;
        c.capacityKwh = n.capacityKwh; c.availableBatterySlots = n.availableBatterySlots;
        c.isActive = n.isActive; c.operatingSchedule = n.operatingSchedule;
        return c;
    }

    private void updateNode(String id, ApiClient.NodeDto updated) {
        ApiClient.api().updateNode(id, updated).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(GridOperatorDashboardActivity.this,
                            "Successfully updated battery slots for " + updated.name, Toast.LENGTH_LONG).show();
                    loadNodes();
                } else {
                    Toast.makeText(GridOperatorDashboardActivity.this, "Failed to update battery slots", Toast.LENGTH_LONG).show();
                }
            }
            @Override public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(GridOperatorDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    // ---------- RESERVATIONS + approve ----------

    private void loadReservations() {
        ApiClient.api().getReservations().enqueue(new Callback<List<ApiClient.ReservationDto>>() {
            @Override public void onResponse(Call<List<ApiClient.ReservationDto>> call, Response<List<ApiClient.ReservationDto>> response) {
                reservations.clear();
                if (response.body() != null) reservations.addAll(response.body());
                renderReservations();
            }
            @Override public void onFailure(Call<List<ApiClient.ReservationDto>> call, Throwable t) {
                Toast.makeText(GridOperatorDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private String nodeName(String id) {
        for (ApiClient.NodeDto n : nodes) if (n.id != null && n.id.equals(id)) return n.name;
        return "Node " + id;
    }

    private void renderReservations() {
        containerReservations.removeAllViews();
        for (ApiClient.ReservationDto r : reservations) containerReservations.addView(reservationRow(r));
    }

    private View reservationRow(ApiClient.ReservationDto r) {
        androidx.cardview.widget.CardView card = Ui.card(this);
        LinearLayout box = Ui.col(this, 12);

        box.addView(Ui.text(this, "Prosumer: " + r.prosumerNic, 15, R.color.brand_ink, true));
        box.addView(Ui.text(this, nodeName(r.microgridNodeId), 14, R.color.brand_muted, false));
        box.addView(Ui.text(this, DateUtils.display(r.scheduledTime) + " • " + r.energyAmountKwh + " kWh",
                14, R.color.brand_muted, false));
        box.addView(Ui.text(this, "Status: " + r.status, 13,
                "Approved".equals(r.status) ? R.color.brand_green : R.color.brand_amber, true));

        if ("Pending".equals(r.status)) {
            Button approve = new Button(this);
            approve.setText("Approve");
            approve.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this, R.color.brand_forest)));
            approve.setTextColor(ContextCompat.getColor(this, R.color.brand_white));
            approve.setOnClickListener(v -> approveReservation(r.id));
            box.addView(approve);
        }

        card.addView(box);
        return card;
    }

    private void approveReservation(String id) {
        ApiClient.api().approveReservation(id).enqueue(new Callback<ApiClient.ReservationDto>() {
            @Override public void onResponse(Call<ApiClient.ReservationDto> call, Response<ApiClient.ReservationDto> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(GridOperatorDashboardActivity.this,
                            "Reservation approved — QR token generated", Toast.LENGTH_LONG).show();
                    loadReservations();
                } else {
                    Toast.makeText(GridOperatorDashboardActivity.this, "Failed to approve reservation", Toast.LENGTH_LONG).show();
                }
            }
            @Override public void onFailure(Call<ApiClient.ReservationDto> call, Throwable t) {
                Toast.makeText(GridOperatorDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    // ---------- QR SCAN (finalize energy transfer) ----------

    private void initiateScan() {
        IntentIntegrator integrator = new IntentIntegrator(this);
        integrator.setPrompt("Scan the Prosumer's reservation QR code");
        integrator.setOrientationLocked(true);
        integrator.initiateScan();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        IntentResult result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (result != null) {
            if (result.getContents() == null) {
                Toast.makeText(this, "Scan cancelled", Toast.LENGTH_SHORT).show();
            } else {
                String qrData = result.getContents();       // format: QR_{reservationId}_{hash}
                String[] parts = qrData.split("_");
                if (parts.length >= 2) {
                    approveReservation(parts[1]);           // verifies + finalizes via backend
                } else {
                    Toast.makeText(this, "Invalid QR format", Toast.LENGTH_LONG).show();
                }
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void logout() {
        db.clearLocalUser();
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }
}