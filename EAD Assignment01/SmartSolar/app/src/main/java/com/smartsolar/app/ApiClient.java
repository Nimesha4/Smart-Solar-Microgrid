package com.smartsolar.app;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.*;

public class ApiClient {

    // 10.0.2.2 = your PC's localhost as seen from the Android Emulator.
    // Physical phone on same Wi-Fi: use your PC's LAN IP, e.g. http://192.168.1.5:5199/api/
    private static final String BASE_URL = "http://10.0.2.2:5199/api/";
    private static Retrofit retrofit;

    public static ApiService api() {
        if (retrofit == null) {
            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit.create(ApiService.class);
    }

    /** Extracts the plain-text error the ASP.NET backend returns (e.g. the 7-day / 12-hour rules). */
    public static String serverError(retrofit2.Response<?> response) {
        try {
            if (response.errorBody() != null) {
                String s = response.errorBody().string().trim();
                if (!s.isEmpty()) return s;
            }
        } catch (Exception ignored) {}
        return "Request failed (code " + response.code() + ")";
    }

    public interface ApiService {
        // ---- Users ----
        @GET("users/{nic}")            Call<UserDto> getUser(@Path("nic") String nic);
        @GET("users")                  Call<List<UserDto>> getUsers();
        @POST("users")                 Call<UserDto> createUser(@Body UserDto user);
        @PUT("users/deactivate/{nic}") Call<Void> deactivateUser(@Path("nic") String nic);
        @PUT("users/activate/{nic}")   Call<Void> activateUser(@Path("nic") String nic);

        // ---- Microgrid Nodes ----
        @GET("nodes")                  Call<List<NodeDto>> getNodes();
        @POST("nodes")                 Call<NodeDto> createNode(@Body NodeDto node);
        @PUT("nodes/{id}")             Call<Void> updateNode(@Path("id") String id, @Body NodeDto node);
        @PUT("nodes/deactivate/{id}")  Call<Void> deactivateNode(@Path("id") String id);

        // ---- Reservations ----
        @GET("reservations")                  Call<List<ReservationDto>> getReservations();
        @GET("reservations/prosumer/{nic}")   Call<List<ReservationDto>> getReservationsByProsumer(@Path("nic") String nic);
        @GET("reservations/{id}")             Call<ReservationDto> getReservation(@Path("id") String id);
        @POST("reservations")                 Call<ReservationDto> createReservation(@Body ReservationDto r);
        @PUT("reservations/approve/{id}")     Call<ReservationDto> approveReservation(@Path("id") String id);
        @DELETE("reservations/{id}")          Call<Void> deleteReservation(@Path("id") String id);
    }

    // PascalCase @SerializedName matches the ASP.NET JSON output exactly.
    public static class UserDto {
        @SerializedName("nic")          public String nic;
        @SerializedName("name")         public String name;
        @SerializedName("role")         public String role;
        @SerializedName("email")        public String email;
        @SerializedName("passwordHash") public String passwordHash;
        @SerializedName("isActive")     public boolean isActive;
    }

    public static class NodeDto {
        @SerializedName("id")                     public String id;
        @SerializedName("name")                   public String name;
        @SerializedName("latitude")               public double latitude;
        @SerializedName("longitude")              public double longitude;
        @SerializedName("capacityKwh")            public double capacityKwh;
        @SerializedName("availableBatterySlots")  public int availableBatterySlots;
        @SerializedName("isActive")               public boolean isActive;
        @SerializedName("operatingSchedule")      public String operatingSchedule;
    }

    public static class ReservationDto {
        @SerializedName("id")                public String id;
        @SerializedName("prosumerNic")       public String prosumerNic;
        @SerializedName("microgridNodeId")   public String microgridNodeId;
        @SerializedName("scheduledTime")     public String scheduledTime;   // ISO-8601, kept as String
        @SerializedName("energyAmountKwh")   public double energyAmountKwh;
        @SerializedName("status")            public String status;
        @SerializedName("qrCodeData")        public String qrCodeData;
    }
}