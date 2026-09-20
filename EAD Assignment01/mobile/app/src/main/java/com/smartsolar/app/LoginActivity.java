package com.smartsolar.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private EditText editNic;
    private Button btnLogin;
    private DatabaseHelper dbHelper;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        dbHelper = new DatabaseHelper(this);
        
        // Check for local persistence first (SQLite)
        String[] localUser = dbHelper.getLocalUser();
        if (localUser != null) {
            routeUser(localUser[1]); // Route based on Role
            return;
        }

        // Mock Layout setup (assuming standard linear layout in XML)
        // setContentView(R.layout.activity_login);
        // editNic = findViewById(R.id.editNic);
        // btnLogin = findViewById(R.id.btnLogin);

        // btnLogin.setOnClickListener(v -> attemptLogin(editNic.getText().toString().trim()));
    }

    private void attemptLogin(String nic) {
        if (nic.isEmpty()) {
            Toast.makeText(this, "NIC is required", Toast.LENGTH_SHORT).show();
            return;
        }

        ApiClient.ApiService apiService = ApiClient.getClient().create(ApiClient.ApiService.class);
        apiService.getUser(nic).enqueue(new Callback<ApiClient.UserDto>() {
            @Override
            public void onResponse(Call<ApiClient.UserDto> call, Response<ApiClient.UserDto> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiClient.UserDto user = response.body();
                    
                    if (!user.isActive) {
                        Toast.makeText(LoginActivity.this, "Account deactivated", Toast.LENGTH_LONG).show();
                        return;
                    }
                    
                    // Save to local SQLite persistence
                    dbHelper.saveUserLocally(user.nic, user.role, user.name);
                    
                    Toast.makeText(LoginActivity.this, "Welcome " + user.name, Toast.LENGTH_SHORT).show();
                    routeUser(user.role);
                } else {
                    Toast.makeText(LoginActivity.this, "Invalid NIC or Not Found", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiClient.UserDto> call, Throwable t) {
                Toast.makeText(LoginActivity.this, "Network Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void routeUser(String role) {
        Intent intent;
        if (role.equals("GridOperator")) {
            intent = new Intent(this, OperatorScannerActivity.class);
        } else {
            // Default to Prosumer mode
            intent = new Intent(this, ProsumerDashboardActivity.class);
        }
        startActivity(intent);
        finish();
    }
}
