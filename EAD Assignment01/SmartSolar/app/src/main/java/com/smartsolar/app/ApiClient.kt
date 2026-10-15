package com.smartsolar.app

import android.content.Context
import com.google.gson.annotations.SerializedName
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Singleton object that builds a Retrofit instance with GsonConverterFactory
 * and an OkHttp logging interceptor.
 */
object ApiClient {

    private const val PREF_NAME = "SmartSolarApiPrefs"
    private const val KEY_BASE_URL = "base_url"

    // Default Base URL pointing to the Render backend deployment
    @JvmField
    val RENDER_BASE_URL: String = "https://smart-solar-microgrid.onrender.com/"

    @get:JvmStatic
    var baseUrl: String = RENDER_BASE_URL
        private set

    @JvmStatic
    fun init(context: Context?) {
        if (context != null) {
            val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            baseUrl = prefs.getString(KEY_BASE_URL, RENDER_BASE_URL) ?: RENDER_BASE_URL
        }
    }

    @JvmStatic
    fun setBaseUrl(context: Context?, newUrl: String?) {
        var url = newUrl?.trim()
        if (url.isNullOrEmpty()) {
            url = RENDER_BASE_URL
        } else if (!url.endsWith("/")) {
            url += "/"
        }
        baseUrl = url
        if (context != null) {
            context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_BASE_URL, baseUrl)
                .apply()
        }
        retrofitInstance = null
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private var retrofitInstance: Retrofit? = null

    private fun getRetrofit(): Retrofit {
        var instance = retrofitInstance
        if (instance == null) {
            instance = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            retrofitInstance = instance
        }
        return instance
    }

    @get:JvmStatic
    val apiService: ApiService
        get() = getRetrofit().create(ApiService::class.java)

    @JvmStatic
    fun api(): ApiService = apiService

    // ---- DTO Models matching ASP.NET JSON output exactly ----

    class LoginRequestDto(
        @JvmField @SerializedName("nic") var nic: String = "",
        @JvmField @SerializedName("password") var password: String = ""
    )

    class LoginResponseDto {
        @JvmField @SerializedName("message") var message: String? = null
        @JvmField @SerializedName("nic") var nic: String? = null
        @JvmField @SerializedName("name") var name: String? = null
        @JvmField @SerializedName("email") var email: String? = null
        @JvmField @SerializedName("role") var role: String? = null
        @JvmField @SerializedName("isActive") var isActive: Boolean = true
    }

    class UserRegisterDto {
        @JvmField @SerializedName("nic") var nic: String? = null
        @JvmField @SerializedName("name") var name: String? = null
        @JvmField @SerializedName("email") var email: String? = null
        @JvmField @SerializedName("password") var password: String? = null
        @JvmField @SerializedName("role") var role: String = "Prosumer"
    }

    class UserDto {
        @JvmField @SerializedName("nic") var nic: String? = null
        @JvmField @SerializedName("name") var name: String? = null
        @JvmField @SerializedName("role") var role: String? = null
        @JvmField @SerializedName("email") var email: String? = null
        @JvmField @SerializedName("isActive") var isActive: Boolean = true
    }

    class NodeDto {
        @JvmField @SerializedName("id") var id: String? = null
        @JvmField @SerializedName("name") var name: String? = null
        @JvmField @SerializedName("latitude") var latitude: Double = 0.0
        @JvmField @SerializedName("longitude") var longitude: Double = 0.0
        @JvmField @SerializedName("capacityKwh") var capacityKwh: Double = 0.0
        @JvmField @SerializedName("availableBatterySlots") var availableBatterySlots: Int = 0
        @JvmField @SerializedName("isActive") var isActive: Boolean = true
        @JvmField @SerializedName("operatingSchedule") var operatingSchedule: String? = null
    }

    class ReservationDto {
        @JvmField @SerializedName("id") var id: String? = null
        @JvmField @SerializedName("prosumerNic") var prosumerNic: String? = null
        @JvmField @SerializedName("microgridNodeId") var microgridNodeId: String? = null
        @JvmField @SerializedName("scheduledTime") var scheduledTime: String? = null
        @JvmField @SerializedName("energyAmountKwh") var energyAmountKwh: Double = 0.0
        @JvmField @SerializedName("status") var status: String? = null
        @JvmField @SerializedName("qrCodeData") var qrCodeData: String? = null
    }

    @JvmStatic
    fun serverError(response: Response<*>): String {
        try {
            response.errorBody()?.string()?.trim()?.let {
                if (it.isNotEmpty()) return it
            }
        } catch (_: Exception) {}
        return "Request failed (code ${response.code()})"
    }

    @JvmStatic
    fun getErrorMessage(t: Throwable?): String {
        val msg = t?.message ?: return "Unable to connect to server."
        if (msg.contains("Failed to connect") || msg.contains("Connection refused") || msg.contains("CLEARTEXT")) {
            return "Cannot reach backend at:\n$baseUrl\n\nEnsure your ASP.NET Core backend is running."
        }
        return "Network error: $msg"
    }
}
