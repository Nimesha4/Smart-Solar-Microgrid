// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: Reservation.cs
// Description: Reservation entity model representing scheduled power trading slots and QR tokens.
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace SmartSolar.Backend.Models
{
    /// <summary>
    /// Represents an energy drop-off or charging reservation scheduled by a prosumer.
    /// </summary>
    public class Reservation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // The Prosumer's NIC
        public string ProsumerNic { get; set; } = null!;

        // The target grid hub
        [BsonRepresentation(BsonType.ObjectId)]
        public string MicrogridNodeId { get; set; } = null!;

        // Scheduled Date and Time for the energy drop-off / charging slot
        public DateTime ScheduledTime { get; set; }
        
        // Energy amount to trade in kW/h
        public double EnergyAmountKwh { get; set; }

        // Status: "Pending", "Approved", "Completed", "Cancelled"
        public string Status { get; set; } = "Pending";

        // Stores a secure transaction QR code string generated on approval
        public string? QrCodeData { get; set; }
    }
}
