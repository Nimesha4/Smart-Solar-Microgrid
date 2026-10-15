package com.smartsolar.app

import retrofit2.Call
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit interface supporting both suspend functions for Kotlin coroutines
 * and Call<T> functions for Java compatibility.
 */
interface ApiService {

    // ---- Authentication Endpoints ----
    @POST("api/users/login")
    fun login(@Body loginRequest: ApiClient.LoginRequestDto): Call<ApiClient.LoginResponseDto>

    @POST("api/users")
    fun registerUser(@Body registerRequest: ApiClient.UserRegisterDto): Call<ApiClient.UserDto>

    // ---- Generic Items Endpoints (Kotlin Coroutines) ----
    @GET("api/items")
    suspend fun getItems(): Response<List<ItemDto>>

    @GET("api/items/{id}")
    suspend fun getItemById(@Path("id") id: String): Response<ItemDto>

    @POST("api/items")
    suspend fun createItem(@Body item: ItemDto): Response<ItemDto>

    // ---- Users Endpoints (Java Call<T>) ----
    @GET("api/users/{nic}")
    fun getUser(@Path("nic") nic: String): Call<ApiClient.UserDto>

    @GET("api/users")
    fun getUsers(): Call<List<ApiClient.UserDto>>

    @POST("api/users")
    fun createUser(@Body user: ApiClient.UserRegisterDto): Call<ApiClient.UserDto>

    @PUT("api/users/deactivate/{nic}")
    fun deactivateUser(@Path("nic") nic: String): Call<Void>

    @PUT("api/users/activate/{nic}")
    fun activateUser(@Path("nic") nic: String): Call<Void>

    // ---- Microgrid Nodes Endpoints (Java Call<T>) ----
    @GET("api/nodes")
    fun getNodes(): Call<List<ApiClient.NodeDto>>

    @POST("api/nodes")
    fun createNode(@Body node: ApiClient.NodeDto): Call<ApiClient.NodeDto>

    @PUT("api/nodes/{id}")
    fun updateNode(@Path("id") id: String, @Body node: ApiClient.NodeDto): Call<Void>

    @PUT("api/nodes/deactivate/{id}")
    fun deactivateNode(@Path("id") id: String): Call<Void>

    // ---- Reservations Endpoints (Java Call<T>) ----
    @GET("api/reservations")
    fun getReservations(): Call<List<ApiClient.ReservationDto>>

    @GET("api/reservations/prosumer/{nic}")
    fun getReservationsByProsumer(@Path("nic") nic: String): Call<List<ApiClient.ReservationDto>>

    @GET("api/reservations/{id}")
    fun getReservation(@Path("id") id: String): Call<ApiClient.ReservationDto>

    @POST("api/reservations")
    fun createReservation(@Body r: ApiClient.ReservationDto): Call<ApiClient.ReservationDto>

    @PUT("api/reservations/approve/{id}")
    fun approveReservation(@Path("id") id: String): Call<ApiClient.ReservationDto>

    @DELETE("api/reservations/{id}")
    fun deleteReservation(@Path("id") id: String): Call<Void>
}
