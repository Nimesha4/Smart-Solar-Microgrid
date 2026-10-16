// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: CreateTransactionRequest.cs
// Description: DTO containing scanned QR payload and reservation ID for transaction finalization.
// ============================================================================

namespace SmartSolar.Backend.Models
{
    /// <summary>
    /// Request data transfer object sent by Grid Operators when scanning a prosumer QR code.
    /// </summary>
    public class CreateTransactionRequest
    {
        public string ReservationId { get; set; } = null!;
        public string QrCodeData { get; set; } = null!;
    }
}