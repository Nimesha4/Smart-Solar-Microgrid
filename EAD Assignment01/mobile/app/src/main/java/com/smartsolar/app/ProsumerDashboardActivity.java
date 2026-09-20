package com.smartsolar.app;

import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;

public class ProsumerDashboardActivity extends AppCompatActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    private DatabaseHelper dbHelper;
    private TextView txtWelcome;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Mock Layout: setContentView(R.layout.activity_prosumer_dashboard);
        dbHelper = new DatabaseHelper(this);
        
        String[] user = dbHelper.getLocalUser();
        if (user != null) {
            // txtWelcome.setText("Welcome back, " + user[2]);
        }
        
        // Initialize Map
        // SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.map);
        // if (mapFragment != null) {
        //     mapFragment.getMapAsync(this);
        // }
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        // In a real implementation, we would call ApiClient to fetch Grid Nodes and plot them.
        // For demonstration:
        LatLng gridHub1 = new LatLng(6.9271, 79.8612); // Colombo coordinates
        mMap.addMarker(new MarkerOptions().position(gridHub1).title("Solar Grid Hub A - Cap: 50kWh"));
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(gridHub1, 12f));
    }
    
    // Other methods would include:
    // - showReservationDialog() to create a new reservation (enforcing 7 days logic happens on server)
    // - loadBookingHistory() to display past reservations and QR codes
}
