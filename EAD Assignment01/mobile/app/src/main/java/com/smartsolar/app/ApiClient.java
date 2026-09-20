package com.smartsolar.app;

import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.Call;

public class ApiClient {
    // 10.0.2.2 is the special alias to your host loopback interface in Android Emulator
    private static final String BASE_URL = "http://10.0.2.2:5199/api/";
    private static Retrofit retrofit = null;

    public static Retrofit getClient() {
        if (retrofit == null) {
            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit;
    }

    public interface ApiService {
        // User Login/Validation
        @GET("users/{nic}")
        Call<UserDto> getUser(@Path("nic") String nic);
        
        // User Registration
        @POST("users")
        Call<UserDto> createUser(@Body UserDto user);

        // QR Code operator scanning verification
        @GET("reservations/{id}")
        Call<ReservationDto> getReservation(@Path("id") String id);
        
        // Finalize transaction
        @PUT("reservations/approve/{id}")
        Call<ReservationDto> approveReservation(@Path("id") String id);
    }

    // DTO Classes for Retrofit
    public static class UserDto {
        public String nic;
        public String name;
        public String role;
        public String email;
        public String passwordHash;
        public boolean isActive;
    }
    
    public static class ReservationDto {
        public String id;
        public String prosumerNic;
        public String status;
        public String qrCodeData;
    }
}
