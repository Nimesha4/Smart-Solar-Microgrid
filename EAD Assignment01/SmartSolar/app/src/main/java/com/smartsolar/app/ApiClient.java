package com.smartsolar.app;

import com.google.gson.annotations.SerializedName;

import java.security.SecureRandom;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.List;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.*;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.*;

public class ApiClient {

    // 10.0.2.2 = your PC's localhost as seen from the Android Emulator.
    // Physical phone on same Wi-Fi: use your PC's LAN IP, e.g. http://192.168.1.5:5199/api/
    private static String BASE_URL = "http://10.0.2.2:5199/api/";
    private static Retrofit retrofit;

    public static void setBaseUrl(String newUrl) {
        if (!newUrl.endsWith("/")) {
            newUrl += "/";
        }
        BASE_URL = newUrl;
        retrofit = null;
    }

    public static String getBaseUrl() {
        return BASE_URL;
    }

    public static ApiService api() {
        if (retrofit == null) {
            OkHttpClient okHttpClient = getUnsafeOkHttpClient();
            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(okHttpClient)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit.create(ApiService.class);
    }

    /**
     * Configures an OkHttpClient that:
     * 1) Accepts self-signed SSL certificates for HTTPS local dev (e.g. https://10.0.2.2:7117/api/)
     * 2) Intercepts redirects and rewrites 'localhost' to '10.0.2.2' if needed
     * 3) Sets 30-second timeouts to avoid quick timeouts during backend startup
     */
    private static OkHttpClient getUnsafeOkHttpClient() {
        try {
            final TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    @Override
                    public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {}
                    @Override
                    public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {}
                    @Override
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[]{};
                    }
                }
            };

            final SSLContext sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, trustAllCerts, new SecureRandom());
            final SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();

            OkHttpClient.Builder builder = new OkHttpClient.Builder();
            builder.sslSocketFactory(sslSocketFactory, (X509TrustManager) trustAllCerts[0]);
            builder.hostnameVerifier((hostname, session) -> true);

            builder.connectTimeout(30, TimeUnit.SECONDS);
            builder.readTimeout(30, TimeUnit.SECONDS);
            builder.writeTimeout(30, TimeUnit.SECONDS);

            builder.addNetworkInterceptor(chain -> {
                Request request = chain.request();
                Response response = chain.proceed(request);
                if (response.isRedirect()) {
                    String location = response.header("Location");
                    if (location != null && location.contains("localhost")) {
                        String newLocation = location.replace("localhost", "10.0.2.2");
                        return response.newBuilder()
                                .header("Location", newLocation)
                                .build();
                    }
                }
                return response;
            });

            return builder.build();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
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
