package com.smartsolar.app;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.*;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
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
        ((TextView) findViewById(R.id.tvWelcome)).setText("Operator • " + user[2]);

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
                ContextCompat.getColor(this, hubs ? R.color.brand_forest : R.color.chip_grey_bg)));
        btnTabHubs.setTextColor(ContextCompat.getColor(this, hubs ? R.color.brand_white : R.color.brand_ink));

        btnTabReservations.setBackgroundTintList(ColorStateList.valueOf(
                ContextCompat.getColor(this, hubs ? R.color.chip_grey_bg : R.color.brand_forest)));
        btnTabReservations.setTextColor(ContextCompat.getColor(this, hubs ? R.color.brand_ink : R.color.brand_white));
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
                Toast.makeText(GridOperatorDashboardActivity.this, ApiClient.getErrorMessage(t), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void renderHubs() {
        containerHubs.removeAllViews();
        for (ApiClient.NodeDto n : nodes) containerHubs.addView(hubRow(n));
    }

    private View hubRow(ApiClient.NodeDto n) {
        MaterialCardView card = Ui.card(this);
        LinearLayout box = Ui.col(this, 16);

        LinearLayout headerRow = Ui.row(this, 0);
        TextView name = Ui.text(this, n.name, 16, R.color.brand_ink, true);
        LinearLayout.LayoutParams nlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        name.setLayoutParams(nlp);
        headerRow.addView(name);

        TextView statusChip = Ui.chip(this, n.isActive ? "Active Hub" : "Inactive",
                n.isActive ? R.drawable.bg_chip_green : R.drawable.bg_chip_grey,
                n.isActive ? R.color.chip_green_text : R.color.chip_grey_text);
        headerRow.addView(statusChip);
        box.addView(headerRow);

        box.addView(Ui.text(this, "Capacity: " + n.capacityKwh + " kWh   •   Schedule: " + n.operatingSchedule,
                13, R.color.brand_muted, false));

        TextInputLayout inputLayout = new TextInputLayout(this);
        inputLayout.setHint("Available Battery Slots");
        inputLayout.setBoxBackgroundMode(TextInputLayout.BOX_BACKGROUND_OUTLINE);
        inputLayout.setBoxCornerRadii(Ui.dp(this, 10), Ui.dp(this, 10), Ui.dp(this, 10), Ui.dp(this, 10));

        TextInputEditText etSlots = new TextInputEditText(this);
        etSlots.setInputType(InputType.TYPE_CLASS_NUMBER);
        etSlots.setText(String.valueOf(n.availableBatterySlots));
        inputLayout.addView(etSlots);

        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        ilp.topMargin = Ui.dp(this, 10);
        inputLayout.setLayoutParams(ilp);
        box.addView(inputLayout);

        MaterialButton save = new MaterialButton(this);
        save.setText("Update Battery Slots");
        save.setCornerRadius(Ui.dp(this, 10));
        save.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this, R.color.brand_forest)));
        save.setTextColor(ContextCompat.getColor(this, R.color.brand_white));

        LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, Ui.dp(this, 44));
        slp.topMargin = Ui.dp(this, 10);
        save.setLayoutParams(slp);
        save.setOnClickListener(v -> {
            try {
                if (etSlots.getText() == null) return;
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
                            "Updated battery slots for " + updated.name, Toast.LENGTH_LONG).show();
                    loadNodes();
                } else {
                    Toast.makeText(GridOperatorDashboardActivity.this, "Failed to update battery slots", Toast.LENGTH_LONG).show();
                }
            }
            @Override public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(GridOperatorDashboardActivity.this, ApiClient.getErrorMessage(t), Toast.LENGTH_LONG).show();
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
                Toast.makeText(GridOperatorDashboardActivity.this, ApiClient.getErrorMessage(t), Toast.LENGTH_LONG).show();
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
        MaterialCardView card = Ui.card(this);
        LinearLayout box = Ui.col(this, 16);

        LinearLayout headerRow = Ui.row(this, 0);
        TextView title = Ui.text(this, "Prosumer: " + r.prosumerNic, 15, R.color.brand_ink, true);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        title.setLayoutParams(tlp);
        headerRow.addView(title);

        boolean isApproved = "Approved".equals(r.status);
        boolean isPending = "Pending".equals(r.status);
        TextView statusChip = Ui.chip(this, r.status,
                isApproved ? R.drawable.bg_chip_green : (isPending ? R.drawable.bg_chip_amber : R.drawable.bg_chip_grey),
                isApproved ? R.color.chip_green_text : (isPending ? R.color.chip_amber_text : R.color.chip_grey_text));
        headerRow.addView(statusChip);
        box.addView(headerRow);

        box.addView(Ui.text(this, "Hub: " + nodeName(r.microgridNodeId), 13, R.color.brand_muted, false));
        box.addView(Ui.text(this, "Scheduled: " + DateUtils.display(r.scheduledTime) + "   •   " + r.energyAmountKwh + " kWh",
                13, R.color.brand_muted, false));

        if (isPending) {
            MaterialButton approve = new MaterialButton(this);
            approve.setText("Approve Reservation");
            approve.setCornerRadius(Ui.dp(this, 10));
            approve.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this, R.color.brand_forest)));
            approve.setTextColor(ContextCompat.getColor(this, R.color.brand_white));

            LinearLayout.LayoutParams alp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, Ui.dp(this, 44));
            alp.topMargin = Ui.dp(this, 12);
            approve.setLayoutParams(alp);
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
                Toast.makeText(GridOperatorDashboardActivity.this, ApiClient.getErrorMessage(t), Toast.LENGTH_LONG).show();
            }
        });
    }

    // ---------- QR SCAN (finalize energy transfer) ----------

    private void initiateScan() {
        IntentIntegrator integrator = new IntentIntegrator(this);
        integrator.setPrompt("Scan Prosumer Reservation QR Code");
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
