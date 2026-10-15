package com.smartsolar.app

import com.google.gson.annotations.SerializedName

/**
 * Data class matching JSON responses from the ASP.NET Core Web API.
 */
data class ItemDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("price") val price: Double? = null
)
