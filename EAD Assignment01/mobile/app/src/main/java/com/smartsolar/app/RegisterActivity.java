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

public class RegisterActivity extends AppCompatActivity {

    private EditText editNic, editName, editEmail, editPassword;
    private Button btnRegister;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        editNic = findViewById(R.id.editNic);
        editName = findViewById(R.id.editName);
        editEmail = findViewById(R.id.editEmail);
        editPassword = findViewById(R.id.editPassword);
        btnRegister = findViewById(R.id.btnRegister);
        android.widget.TextView tvLogin = findViewById(R.id.tvLogin);

        btnRegister.setOnClickListener(v -> attemptRegister());
        tvLogin.setOnClickListener(v -> finish());
    }

    private void attemptRegister() {
        String nic = editNic.getText().toString().trim();
        String name = editName.getText().toString().trim();
        String email = editEmail.getText().toString().trim();
        String password = editPassword.getText().toString().trim();

        if (nic.isEmpty() || name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "All fields are required", Toast.LENGTH_SHORT).show();
            return;
        }

        ApiClient.UserDto newUser = new ApiClient.UserDto();
        newUser.nic = nic;
        newUser.name = name;
        newUser.email = email;
        newUser.passwordHash = password;
        newUser.role = "Prosumer"; // Default role for self registration
        newUser.isActive = true;

        ApiClient.ApiService apiService = ApiClient.getClient().create(ApiClient.ApiService.class);
        apiService.createUser(newUser).enqueue(new Callback<ApiClient.UserDto>() {
            @Override
            public void onResponse(Call<ApiClient.UserDto> call, Response<ApiClient.UserDto> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(RegisterActivity.this, "Registration Successful! Please login.", Toast.LENGTH_LONG).show();
                    finish(); // Go back to Login Activity
                } else {
                    Toast.makeText(RegisterActivity.this, "Registration Failed. NIC may exist.", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ApiClient.UserDto> call, Throwable t) {
                Toast.makeText(RegisterActivity.this, "Network Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
