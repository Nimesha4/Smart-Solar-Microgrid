package com.smartsolar.app;

import android.content.Intent;
import android.os.Bundle;
import android.text.InputType;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ApiClient.init(this);

        DatabaseHelper db = new DatabaseHelper(this);
        String[] saved = db.getLocalUser();
        if (saved != null) {                 // stay signed in
            routeUser(saved[1]);
            return;
        }

        setContentView(R.layout.activity_login);
        EditText etNic = findViewById(R.id.etNic);
        EditText etPassword = findViewById(R.id.etPassword);

        findViewById(R.id.btnLogin).setOnClickListener(v -> {
            String nic = etNic.getText().toString().trim();
            String password = etPassword.getText().toString();
            if (nic.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "NIC and password are required", Toast.LENGTH_SHORT).show();
                return;
            }
            login(nic, password, db);
        });

        ((TextView) findViewById(R.id.tvRegister)).setOnClickListener(v ->
                startActivity(new Intent(this, RegisterActivity.class)));

        findViewById(R.id.btnServerSettings).setOnClickListener(v -> showServerConfigDialog());
    }

    private void showServerConfigDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Backend Server Configuration");

        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_TEXT_VARIATION_URI);
        input.setHint("e.g. " + ApiClient.RENDER_BASE_URL);
        input.setText(ApiClient.getBaseUrl());
        input.setPadding(40, 30, 40, 30);
        builder.setView(input);

        builder.setPositiveButton("Save", (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            ApiClient.setBaseUrl(this, newUrl);
            Toast.makeText(this, "Server URL updated to:\n" + ApiClient.getBaseUrl(), Toast.LENGTH_LONG).show();
        });

        builder.setNegativeButton("Reset Default", (dialog, which) -> {
            ApiClient.setBaseUrl(this, ApiClient.RENDER_BASE_URL);
            Toast.makeText(this, "Reset to default:\n" + ApiClient.RENDER_BASE_URL, Toast.LENGTH_SHORT).show();
        });

        builder.setNeutralButton("Cancel", null);
        builder.show();
    }

    private void login(String nic, String password, DatabaseHelper db) {
        ApiClient.LoginRequestDto request = new ApiClient.LoginRequestDto(nic, password);

        ApiClient.api().login(request).enqueue(new Callback<ApiClient.LoginResponseDto>() {
            @Override
            public void onResponse(Call<ApiClient.LoginResponseDto> call, Response<ApiClient.LoginResponseDto> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiClient.LoginResponseDto user = response.body();

                    if (!user.isActive) {
                        Toast.makeText(LoginActivity.this, "Account is deactivated. Contact Backoffice.", Toast.LENGTH_LONG).show();
                        return;
                    }

                    db.saveUserLocally(user.nic, user.role, user.name, user.email);
                    Toast.makeText(LoginActivity.this, "Welcome " + user.name, Toast.LENGTH_SHORT).show();
                    routeUser(user.role);
                } else if (response.code() == 401) {
                    Toast.makeText(LoginActivity.this, "Invalid NIC or password.", Toast.LENGTH_LONG).show();
                } else if (response.code() == 403) {
                    Toast.makeText(LoginActivity.this, "Account is deactivated. Contact Backoffice.", Toast.LENGTH_LONG).show();
                } else {
                    String serverErr = ApiClient.serverError(response);
                    Toast.makeText(LoginActivity.this, "Login failed: " + serverErr, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ApiClient.LoginResponseDto> call, Throwable t) {
                new AlertDialog.Builder(LoginActivity.this)
                        .setTitle("Connection Error")
                        .setMessage(ApiClient.getErrorMessage(t))
                        .setPositiveButton("Retry", (dialog, which) -> login(nic, password, db))
                        .setNegativeButton("Change Server URL", (dialog, which) -> showServerConfigDialog())
                        .setNeutralButton("Close", null)
                        .show();
            }
        });
    }

    private void routeUser(String role) {
        Intent intent;
        if ("Backoffice".equals(role)) intent = new Intent(this, BackofficeDashboardActivity.class);
        else if ("GridOperator".equals(role)) intent = new Intent(this, GridOperatorDashboardActivity.class);
        else intent = new Intent(this, ProsumerDashboardActivity.class); // Prosumer (and default)
        startActivity(intent);
        finish();
    }
}
