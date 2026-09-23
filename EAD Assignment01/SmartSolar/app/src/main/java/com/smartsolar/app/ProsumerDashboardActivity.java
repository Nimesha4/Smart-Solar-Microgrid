package com.smartsolar.app;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.google.zxing.BarcodeFormat;
import com.journeyapps.barcodescanner.BarcodeEncoder;
import java.util.*;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProsumerDashboardActivity extends AppCompatActivity {

    private DatabaseHelper db;
    private String nic, name;
    private final List<ApiClient.NodeDto> nodes = new ArrayList<>();
    private final List<ApiClient.ReservationDto> reservations = new ArrayList<>();
    private final Calendar chosen = Calendar.getInstance();

    private Spinner spinnerNodes;
    private EditText etEnergy;
    private TextView tvDateChosen, tvReserveMsg, tvBookingsEmpty;
    private LinearLayout panelReserve, panelBookings, containerBookings;
    private Button btnTabReserve, btnTabBookings;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_prosumer);

        db = new DatabaseHelper(this);
        String[] user = db.getLocalUser();
        if (user == null) { logout(); return; }
        nic = user[0]; name = user[2];
        ((TextView) findViewById(R.id.tvWelcome)).setText("Hello, " + name);

        spinnerNodes = findViewById(R.id.spinnerNodes);
        etEnergy = findViewById(R.id.etEnergy);
        tvDateChosen = findViewById(R.id.tvDateChosen);
        tvReserveMsg = findViewById(R.id.tvReserveMsg);
        tvBookingsEmpty = findViewById(R.id.tvBookingsEmpty);
        panelReserve = findViewById(R.id.panelReserve);
        panelBookings = findViewById(R.id.panelBookings);
        containerBookings = findViewById(R.id.containerBookings);
        btnTabReserve = findViewById(R.id.btnTabReserve);
        btnTabBookings = findViewById(R.id.btnTabBookings);

        btnTabReserve.setOnClickListener(v -> showTab(true));
        btnTabBookings.setOnClickListener(v -> showTab(false));
        findViewById(R.id.btnPickDate).setOnClickListener(v -> pickDateTime());
        findViewById(R.id.btnCreate).setOnClickListener(v -> createReservation());
        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            new AlertDialog.Builder(this).setTitle("Sign out?").setPositiveButton("Yes", (d, w) -> logout())
                    .setNegativeButton("Cancel", null).show();
        });

        loadNodes();
        loadReservations();
    }

    private void showTab(boolean reserve) {
        panelReserve.setVisibility(reserve ? View.VISIBLE : View.GONE);
        panelBookings.setVisibility(reserve ? View.GONE : View.VISIBLE);
        btnTabReserve.setBackgroundTintList(ColorStateList.valueOf(
                ContextCompat.getColor(this, reserve ? R.color.brand_amber : R.color.chip_grey_bg)));
        btnTabBookings.setBackgroundTintList(ColorStateList.valueOf(
                ContextCompat.getColor(this, reserve ? R.color.chip_grey_bg : R.color.brand_amber)));
    }

    // ---------- NODES ----------

    private void loadNodes() {
        ApiClient.api().getNodes().enqueue(new Callback<List<ApiClient.NodeDto>>() {
            @Override public void onResponse(Call<List<ApiClient.NodeDto>> call, Response<List<ApiClient.NodeDto>> response) {
                nodes.clear();
                if (response.body() != null)
                    for (ApiClient.NodeDto n : response.body())
                        if (n.isActive) nodes.add(n);          // only active hubs are bookable

                List<String> labels = new ArrayList<>();
                for (ApiClient.NodeDto n : nodes)
                    labels.add(n.name + " (" + n.latitude + ", " + n.longitude + ")");
                ArrayAdapter<String> adapter = new ArrayAdapter<>(ProsumerDashboardActivity.this,
                        android.R.layout.simple_spinner_item, labels);
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
                spinnerNodes.setAdapter(adapter);
            }

            @Override public void onFailure(Call<List<ApiClient.NodeDto>> call, Throwable t) {
                Toast.makeText(ProsumerDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private String nodeName(String id) {
        for (ApiClient.NodeDto n : nodes) if (n.id != null && n.id.equals(id)) return n.name;
        return "Node " + id;
    }

    // ---------- CREATE RESERVATION ----------

    private void pickDateTime() {
        Calendar min = Calendar.getInstance();
        min.add(Calendar.HOUR, 1);                     // slightly in the future
        Calendar max = Calendar.getInstance();
        max.add(Calendar.DAY_OF_YEAR, 7);              // 7-day rule

        new DatePickerDialog(this, (view, year, month, day) -> {
            new TimePickerDialog(this, (tv, hour, minute) -> {
                chosen.set(year, month, day, hour, minute, 0);
                if (chosen.before(min) || chosen.after(max)) {
                    tvReserveMsg.setText("Date must be in the future and within 7 days.");
                } else {
                    tvReserveMsg.setText("");
                    tvDateChosen.setText(DateUtils.display(DateUtils.toIso(chosen.getTime())));
                }
            }, 12, 0, false).show();
        }, min.get(Calendar.YEAR), min.get(Calendar.MONTH), min.get(Calendar.DAY_OF_MONTH)).show();
    }

    private void createReservation() {
        tvReserveMsg.setText("");
        if (spinnerNodes.getSelectedItemPosition() < 0 || nodes.isEmpty()) {
            tvReserveMsg.setText("No active node selected"); return;
        }
        String energyText = etEnergy.getText().toString().trim();
        if (energyText.isEmpty()) { tvReserveMsg.setText("Enter the energy amount"); return; }

        double kwh;
        try { kwh = Double.parseDouble(energyText); }
        catch (NumberFormatException e) { tvReserveMsg.setText("Invalid energy amount"); return; }

        Calendar now = Calendar.getInstance(), max = Calendar.getInstance();
        now.add(Calendar.MINUTE, 1); max.add(Calendar.DAY_OF_YEAR, 7);
        if (chosen.before(now) || chosen.after(max)) {
            tvReserveMsg.setText("Reservations must be in the future and within 7 days.");
            return;
        }

        ApiClient.ReservationDto r = new ApiClient.ReservationDto();
        r.prosumerNic = nic;
        r.microgridNodeId = nodes.get(spinnerNodes.getSelectedItemPosition()).id;
        r.scheduledTime = DateUtils.toIso(chosen.getTime());   // backend validates again
        r.energyAmountKwh = kwh;

        ApiClient.api().createReservation(r).enqueue(new Callback<ApiClient.ReservationDto>() {
            @Override public void onResponse(Call<ApiClient.ReservationDto> call, Response<ApiClient.ReservationDto> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(ProsumerDashboardActivity.this, "Booking created successfully!", Toast.LENGTH_LONG).show();
                    etEnergy.setText("");
                    loadReservations();
                    showTab(false);
                } else {
                    tvReserveMsg.setText(ApiClient.serverError(response)); // shows backend 7-day rule text
                }
            }
            @Override public void onFailure(Call<ApiClient.ReservationDto> call, Throwable t) {
                Toast.makeText(ProsumerDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    // ---------- MY BOOKINGS ----------

    private void loadReservations() {
        ApiClient.api().getReservationsByProsumer(nic).enqueue(new Callback<List<ApiClient.ReservationDto>>() {
            @Override public void onResponse(Call<List<ApiClient.ReservationDto>> call, Response<List<ApiClient.ReservationDto>> response) {
                reservations.clear();
                if (response.body() != null) reservations.addAll(response.body());
                renderBookings();
            }
            @Override public void onFailure(Call<List<ApiClient.ReservationDto>> call, Throwable t) {
                Toast.makeText(ProsumerDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void renderBookings() {
        containerBookings.removeAllViews();
        tvBookingsEmpty.setVisibility(reservations.isEmpty() ? View.VISIBLE : View.GONE);
        for (ApiClient.ReservationDto r : reservations) containerBookings.addView(bookingRow(r));
    }

    private View bookingRow(ApiClient.ReservationDto r) {
        androidx.cardview.widget.CardView card = Ui.card(this);
        LinearLayout box = Ui.col(this, 12);

        box.addView(Ui.text(this, nodeName(r.microgridNodeId), 16, R.color.brand_ink, true));
        box.addView(Ui.text(this, DateUtils.display(r.scheduledTime), 14, R.color.brand_muted, false));
        box.addView(Ui.text(this, r.energyAmountKwh + " kWh", 14, R.color.brand_muted, false));

        TextView status = Ui.text(this, r.status, 13,
                "Approved".equals(r.status) ? R.color.brand_green
                        : "Pending".equals(r.status) ? R.color.brand_amber : R.color.brand_muted, true);
        status.setBackgroundColor(ContextCompat.getColor(this,
                "Approved".equals(r.status) ? R.color.chip_green_bg
                        : "Pending".equals(r.status) ? R.color.chip_amber_bg : R.color.chip_grey_bg));
        status.setPadding(Ui.dp(this, 10), Ui.dp(this, 3), Ui.dp(this, 10), Ui.dp(this, 3));
        box.addView(status);

        if ("Approved".equals(r.status) && r.qrCodeData != null && !r.qrCodeData.isEmpty()) {
            ImageView qr = new ImageView(this);
            try {
                Bitmap bmp = new BarcodeEncoder().encodeBitmap(r.qrCodeData, BarcodeFormat.QR_CODE, 280, 280);
                qr.setImageBitmap(bmp);
            } catch (Exception ignored) {}
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(Ui.dp(this, 150), Ui.dp(this, 150));
            lp.topMargin = Ui.dp(this, 8);
            qr.setLayoutParams(lp);
            box.addView(qr);
            box.addView(Ui.text(this, r.qrCodeData, 11, R.color.brand_muted, false));
        }

        Button cancel = new Button(this);
        cancel.setText("Cancel Booking");
        cancel.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this, R.color.brand_red)));
        cancel.setTextColor(ContextCompat.getColor(this, R.color.brand_white));
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        clp.topMargin = Ui.dp(this, 8);
        cancel.setLayoutParams(clp);
        cancel.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("Cancel booking?")
                .setMessage("Cancellations require at least 12 hours notice.")
                .setPositiveButton("Yes, cancel", (d, w) -> cancelReservation(r.id))
                .setNegativeButton("Back", null).show());
        box.addView(cancel);

        card.addView(box);
        return card;
    }

    private void cancelReservation(String id) {
        ApiClient.api().deleteReservation(id).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(ProsumerDashboardActivity.this, "Booking cancelled", Toast.LENGTH_SHORT).show();
                    loadReservations();
                } else {
                    Toast.makeText(ProsumerDashboardActivity.this, ApiClient.serverError(response), Toast.LENGTH_LONG).show();
                }
            }
            @Override public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(ProsumerDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void logout() {
        db.clearLocalUser();
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }
}