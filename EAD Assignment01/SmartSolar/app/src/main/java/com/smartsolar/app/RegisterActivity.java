package com.smartsolar.app;

import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        EditText etNic = findViewById(R.id.etNic);
        EditText etName = findViewById(R.id.etName);
        EditText etEmail = findViewById(R.id.etEmail);
        EditText etPassword = findViewById(R.id.etPassword);

        findViewById(R.id.btnRegister).setOnClickListener(v -> {
            String nic = etNic.getText().toString().trim();
            String name = etName.getText().toString().trim();
            String email = etEmail.getText().toString().trim();
            String password = etPassword.getText().toString();

            if (nic.isEmpty() || name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "All fields are required", Toast.LENGTH_SHORT).show();
                return;
            }

            ApiClient.UserDto newUser = new ApiClient.UserDto();
            newUser.nic = nic;
            newUser.name = name;
            newUser.email = email;
            newUser.passwordHash = password;
            newUser.role = "Prosumer";   // default role for self-registration (same as web)
            newUser.isActive = true;

            ApiClient.api().createUser(newUser).enqueue(new Callback<ApiClient.UserDto>() {
                @Override
                public void onResponse(Call<ApiClient.UserDto> call, Response<ApiClient.UserDto> response) {
                    if (response.isSuccessful()) {
                        Toast.makeText(RegisterActivity.this, "Registration successful! Please sign in.", Toast.LENGTH_LONG).show();
                        finish();
                    } else {
                        Toast.makeText(RegisterActivity.this, "Registration failed. NIC may already exist.", Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiClient.UserDto> call, Throwable t) {
                    Toast.makeText(RegisterActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        });

        findViewById(R.id.tvLogin).setOnClickListener(v -> finish());
    }
}