package com.smartsolar.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        DatabaseHelper db = new DatabaseHelper(this);
        String[] saved = db.getLocalUser();
        if (saved != null) {                 // stay signed in (localStorage equivalent)
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
    }

    private void login(String nic, String password, DatabaseHelper db) {
        ApiClient.api().getUser(nic).enqueue(new Callback<ApiClient.UserDto>() {
            @Override
            public void onResponse(Call<ApiClient.UserDto> call, Response<ApiClient.UserDto> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    Toast.makeText(LoginActivity.this, "User not found or connection error", Toast.LENGTH_LONG).show();
                    return;
                }
                ApiClient.UserDto user = response.body();
                if (!user.isActive) {
                    Toast.makeText(LoginActivity.this, "Account is deactivated. Contact Backoffice.", Toast.LENGTH_LONG).show();
                    return;
                }
                if (!password.equals(user.passwordHash)) {
                    Toast.makeText(LoginActivity.this, "Incorrect password.", Toast.LENGTH_LONG).show();
                    return;
                }
                db.saveUserLocally(user.nic, user.role, user.name, user.email);
                Toast.makeText(LoginActivity.this, "Welcome " + user.name, Toast.LENGTH_SHORT).show();
                routeUser(user.role);
            }

            @Override
            public void onFailure(Call<ApiClient.UserDto> call, Throwable t) {
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
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