package com.smartsolar.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class OperatorScannerActivity extends AppCompatActivity {

    private Button btnScanQr;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // setContentView(R.layout.activity_operator_scanner);

        // btnScanQr = findViewById(R.id.btnScanQr);
        // btnScanQr.setOnClickListener(v -> initiateScan());
    }

    private void initiateScan() {
        IntentIntegrator integrator = new IntentIntegrator(this);
        integrator.setPrompt("Scan Prosumer's QR Code for Energy Transfer");
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
                String qrData = result.getContents();
                // Expected format: "QR_{reservationId}_hash"
                String[] parts = qrData.split("_");
                if (parts.length >= 2) {
                    verifyAndFinalizeTransfer(parts[1]);
                } else {
                    Toast.makeText(this, "Invalid QR Format", Toast.LENGTH_LONG).show();
                }
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void verifyAndFinalizeTransfer(String reservationId) {
        ApiClient.ApiService apiService = ApiClient.getClient().create(ApiClient.ApiService.class);
        
        // Finalize energy transfer business logic on the server via PUT request
        apiService.approveReservation(reservationId).enqueue(new Callback<ApiClient.ReservationDto>() {
            @Override
            public void onResponse(Call<ApiClient.ReservationDto> call, Response<ApiClient.ReservationDto> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(OperatorScannerActivity.this, "Energy Transfer Finalized!", Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(OperatorScannerActivity.this, "Server Verification Failed", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ApiClient.ReservationDto> call, Throwable t) {
                Toast.makeText(OperatorScannerActivity.this, "Network error", Toast.LENGTH_LONG).show();
            }
        });
    }
}
