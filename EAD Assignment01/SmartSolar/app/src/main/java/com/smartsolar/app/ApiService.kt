package com.smartsolar.app

import retrofit2.Call
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit interface supporting both suspend functions for Kotlin coroutines
 * and Call<T> functions for Java compatibility.
 */
interface ApiService {

    // ---- Generic Items Endpoints (Kotlin Coroutines) ----
    @GET("api/items")
    suspend fun getItems(): Response<List<ItemDto>>

    @GET("api/items/{id}")
    suspend fun getItemById(@Path("id") id: String): Response<ItemDto>

    @POST("api/items")
    suspend fun createItem(@Body item: ItemDto): Response<ItemDto>

    // ---- Users Endpoints (Java Call<T>) ----
    @GET("users/{nic}")
    fun getUser(@Path("nic") nic: String): Call<ApiClient.UserDto>

    @GET("users")
    fun getUsers(): Call<List<ApiClient.UserDto>>

    @POST("users")
    fun createUser(@Body user: ApiClient.UserDto): Call<ApiClient.UserDto>

    @PUT("users/deactivate/{nic}")
    fun deactivateUser(@Path("nic") nic: String): Call<Void>

    @PUT("users/activate/{nic}")
    fun activateUser(@Path("nic") nic: String): Call<Void>

    // ---- Microgrid Nodes Endpoints (Java Call<T>) ----
    @GET("nodes")
    fun getNodes(): Call<List<ApiClient.NodeDto>>

    @POST("nodes")
    fun createNode(@Body node: ApiClient.NodeDto): Call<ApiClient.NodeDto>

    @PUT("nodes/{id}")
    fun updateNode(@Path("id") id: String, @Body node: ApiClient.NodeDto): Call<Void>

    @PUT("nodes/deactivate/{id}")
    fun deactivateNode(@Path("id") id: String): Call<Void>

    // ---- Reservations Endpoints (Java Call<T>) ----
    @GET("reservations")
    fun getReservations(): Call<List<ApiClient.ReservationDto>>

    @GET("reservations/prosumer/{nic}")
    fun getReservationsByProsumer(@Path("nic") nic: String): Call<List<ApiClient.ReservationDto>>

    @GET("reservations/{id}")
    fun getReservation(@Path("id") id: String): Call<ApiClient.ReservationDto>

    @POST("reservations")
    fun createReservation(@Body r: ApiClient.ReservationDto): Call<ApiClient.ReservationDto>

    @PUT("reservations/approve/{id}")
    fun approveReservation(@Path("id") id: String): Call<ApiClient.ReservationDto>

    @DELETE("reservations/{id}")
    fun deleteReservation(@Path("id") id: String): Call<Void>
}
