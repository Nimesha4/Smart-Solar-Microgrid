package com.smartsolar.app;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import java.util.*;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BackofficeDashboardActivity extends AppCompatActivity {

    private DatabaseHelper db;
    private final List<ApiClient.UserDto> users = new ArrayList<>();
    private final List<ApiClient.NodeDto> nodes = new ArrayList<>();
    private LinearLayout panelUsers, panelHubs, containerUsers, containerHubs;
    private Button btnTabUsers, btnTabHubs;
    private EditText etSearch;
    private Spinner spinnerRoleFilter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_backoffice);

        db = new DatabaseHelper(this);
        String[] user = db.getLocalUser();
        if (user == null) { logout(); return; }
        ((TextView) findViewById(R.id.tvWelcome)).setText("Backoffice • " + user[2]);

        panelUsers = findViewById(R.id.panelUsers);
        panelHubs = findViewById(R.id.panelHubs);
        containerUsers = findViewById(R.id.containerUsers);
        containerHubs = findViewById(R.id.containerHubs);
        btnTabUsers = findViewById(R.id.btnTabUsers);
        btnTabHubs = findViewById(R.id.btnTabHubs);
        etSearch = findViewById(R.id.etSearch);
        spinnerRoleFilter = findViewById(R.id.spinnerRoleFilter);

        btnTabUsers.setOnClickListener(v -> showTab(true));
        btnTabHubs.setOnClickListener(v -> showTab(false));
        findViewById(R.id.btnLogout).setOnClickListener(v -> logout());
        findViewById(R.id.btnCreateNode).setOnClickListener(v -> createNode());

        spinnerRoleFilter.setAdapter(new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item,
                new String[]{"All", "Backoffice", "GridOperator", "Prosumer"}));
        spinnerRoleFilter.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> p, View v, int pos, long id) { renderUsers(); }
            @Override public void onNothingSelected(AdapterView<?> p) {}
        });
        etSearch.addTextChangedListener(new android.text.TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int a, int b, int c) {}
            @Override public void onTextChanged(CharSequence s, int a, int b, int c) { renderUsers(); }
            @Override public void afterTextChanged(android.text.Editable s) {}
        });

        loadUsers();
        loadNodes();
    }

    private void showTab(boolean users) {
        panelUsers.setVisibility(users ? View.VISIBLE : View.GONE);
        panelHubs.setVisibility(users ? View.GONE : View.VISIBLE);
        btnTabUsers.setBackgroundTintList(ColorStateList.valueOf(
                ContextCompat.getColor(this, users ? R.color.brand_amber : R.color.chip_grey_bg)));
        btnTabHubs.setBackgroundTintList(ColorStateList.valueOf(
                ContextCompat.getColor(this, users ? R.color.chip_grey_bg : R.color.brand_amber)));
    }

    // ---------- USERS ----------

    private void loadUsers() {
        ApiClient.api().getUsers().enqueue(new Callback<List<ApiClient.UserDto>>() {
            @Override public void onResponse(Call<List<ApiClient.UserDto>> call, Response<List<ApiClient.UserDto>> response) {
                users.clear();
                if (response.body() != null) users.addAll(response.body());
                renderUsers();
            }
            @Override public void onFailure(Call<List<ApiClient.UserDto>> call, Throwable t) {
                Toast.makeText(BackofficeDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void renderUsers() {
        containerUsers.removeAllViews();
        String query = etSearch.getText().toString().toLowerCase();
        String role = spinnerRoleFilter.getSelectedItem() == null
                ? "All" : spinnerRoleFilter.getSelectedItem().toString();

        for (ApiClient.UserDto u : users) {
            boolean matchesRole = "All".equals(role) || role.equals(u.role);
            boolean matchesQuery = query.isEmpty()
                    || u.name.toLowerCase().contains(query)
                    || u.nic.toLowerCase().contains(query)
                    || u.email.toLowerCase().contains(query);
            if (matchesRole && matchesQuery) containerUsers.addView(userRow(u));
        }
    }

    private View userRow(ApiClient.UserDto u) {
        androidx.cardview.widget.CardView card = Ui.card(this);
        LinearLayout box = Ui.col(this, 12);

        box.addView(Ui.text(this, u.name, 16, R.color.brand_ink, true));
        box.addView(Ui.text(this, "NIC: " + u.nic + "  •  " + u.role, 13, R.color.brand_muted, false));
        box.addView(Ui.text(this, u.email, 13, R.color.brand_muted, false));
        box.addView(Ui.text(this, u.isActive ? "Active" : "Deactivated", 13,
                u.isActive ? R.color.brand_green : R.color.brand_red, true));

        Button toggle = new Button(this);
        toggle.setText(u.isActive ? "Deactivate" : "Activate");
        toggle.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this,
                u.isActive ? R.color.brand_red : R.color.brand_green)));
        toggle.setTextColor(ContextCompat.getColor(this, R.color.brand_white));
        toggle.setOnClickListener(v -> setUserActive(u.nic, !u.isActive));
        box.addView(toggle);

        card.addView(box);
        return card;
    }

    private void setUserActive(String nic, boolean active) {
        Call<Void> call = active ? ApiClient.api().activateUser(nic)
                : ApiClient.api().deactivateUser(nic);
        call.enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) loadUsers();
                else Toast.makeText(BackofficeDashboardActivity.this,
                        active ? "Failed to activate user." : "Failed to deactivate user.", Toast.LENGTH_LONG).show();
            }
            @Override public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(BackofficeDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    // ---------- HUBS ----------

    private void loadNodes() {
        ApiClient.api().getNodes().enqueue(new Callback<List<ApiClient.NodeDto>>() {
            @Override public void onResponse(Call<List<ApiClient.NodeDto>> call, Response<List<ApiClient.NodeDto>> response) {
                nodes.clear();
                if (response.body() != null) nodes.addAll(response.body());
                renderHubs();
            }
            @Override public void onFailure(Call<List<ApiClient.NodeDto>> call, Throwable t) {
                Toast.makeText(BackofficeDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
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
        box.addView(Ui.text(this, "Capacity: " + n.capacityKwh + " kWh • Slots: " + n.availableBatterySlots,
                13, R.color.brand_muted, false));

        if (n.isActive) {
            Button deactivate = new Button(this);
            deactivate.setText("Deactivate Hub");
            deactivate.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this, R.color.brand_red)));
            deactivate.setTextColor(ContextCompat.getColor(this, R.color.brand_white));
            deactivate.setOnClickListener(v -> deactivateNode(n.id));
            box.addView(deactivate);
        }

        card.addView(box);
        return card;
    }

    private void deactivateNode(String id) {
        ApiClient.api().deactivateNode(id).enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(BackofficeDashboardActivity.this, "Hub deactivated", Toast.LENGTH_SHORT).show();
                    loadNodes();
                } else {
                    // backend blocks this if active reservations exist (400)
                    Toast.makeText(BackofficeDashboardActivity.this, ApiClient.serverError(response), Toast.LENGTH_LONG).show();
                }
            }
            @Override public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(BackofficeDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void createNode() {
        EditText etName = findViewById(R.id.etNodeName);
        EditText etCapacity = findViewById(R.id.etCapacity);
        EditText etSlots = findViewById(R.id.etSlots);

        String name = etName.getText().toString().trim();
        String capText = etCapacity.getText().toString().trim();
        String slotText = etSlots.getText().toString().trim();

        if (name.isEmpty() || capText.isEmpty() || slotText.isEmpty()) {
            Toast.makeText(this, "All hub fields are required", Toast.LENGTH_SHORT).show();
            return;
        }

        ApiClient.NodeDto node = new ApiClient.NodeDto();
        node.name = name;
        node.capacityKwh = Double.parseDouble(capText);
        node.availableBatterySlots = Integer.parseInt(slotText);
        node.latitude = 0; node.longitude = 0;
        node.isActive = true;
        node.operatingSchedule = "00:00-23:59";

        ApiClient.api().createNode(node).enqueue(new Callback<ApiClient.NodeDto>() {
            @Override public void onResponse(Call<ApiClient.NodeDto> call, Response<ApiClient.NodeDto> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(BackofficeDashboardActivity.this, "Node created", Toast.LENGTH_SHORT).show();
                    etName.setText(""); etCapacity.setText(""); etSlots.setText("");
                    loadNodes();
                } else {
                    Toast.makeText(BackofficeDashboardActivity.this, "Failed to create node", Toast.LENGTH_LONG).show();
                }
            }
            @Override public void onFailure(Call<ApiClient.NodeDto> call, Throwable t) {
                Toast.makeText(BackofficeDashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void logout() {
        db.clearLocalUser();
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }
}