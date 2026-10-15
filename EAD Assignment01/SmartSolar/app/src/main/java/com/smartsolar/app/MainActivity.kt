package com.smartsolar.app

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private companion object {
        private const val TAG = "API"
    }

    private lateinit var progressBar: ProgressBar
    private lateinit var tvStatus: TextView
    private lateinit var btnFetch: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        progressBar = findViewById(R.id.progressBar)
        tvStatus = findViewById(R.id.tvStatus)
        btnFetch = findViewById(R.id.btnFetch)

        btnFetch.setOnClickListener {
            fetchItems()
        }

        // Fetch on initial screen launch
        fetchItems()
    }

    private fun fetchItems() {
        // Show loading state
        progressBar.visibility = View.VISIBLE
        tvStatus.text = "Fetching items from API..."
        btnFetch.isEnabled = false

        lifecycleScope.launch {
            try {
                Log.d(TAG, "Calling API endpoint: api/items")
                val response = ApiClient.apiService.getItems()

                if (response.isSuccessful) {
                    val items = response.body() ?: emptyList()
                    Log.d(TAG, "API Call Success. Received ${items.size} items: $items")

                    if (items.isNotEmpty()) {
                        val displayText = items.joinToString("\n\n") { item ->
                            "ID: ${item.id ?: "N/A"}\nName: ${item.name ?: "N/A"}\nDescription: ${item.description ?: "N/A"}\nPrice: \$${item.price ?: 0.0}"
                        }
                        tvStatus.text = "Successfully loaded ${items.size} items:\n\n$displayText"
                    } else {
                        tvStatus.text = "Connected successfully! Response body is empty (0 items)."
                    }
                } else {
                    val errorMsg = "API returned HTTP error code ${response.code()}: ${response.errorBody()?.string()}"
                    Log.e(TAG, errorMsg)
                    tvStatus.text = errorMsg
                }
            } catch (e: Exception) {
                val errorMsg = "Failed to connect to API: ${e.localizedMessage}"
                Log.e(TAG, "API Call Exception", e)
                tvStatus.text = "$errorMsg\n\nPlease verify that your ASP.NET Core API is running on IIS at http://10.0.2.2:8080/"
            } finally {
                // Hide loading state
                progressBar.visibility = View.GONE
                btnFetch.isEnabled = true
            }
        }
    }
}
