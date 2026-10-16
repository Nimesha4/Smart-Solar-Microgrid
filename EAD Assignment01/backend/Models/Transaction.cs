
// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: Transaction.cs
// Description: Transaction entity model representing confirmed energy transfers finalized by Grid Operators.
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolar.Backend.Models
{
    /// <summary>
    /// Represents a completed energy transfer transaction logged after QR verification.
    /// </summary>
    public class Transaction
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string ReservationId { get; set; } = null!;

        public string ProsumerNic { get; set; } = null!;

        [BsonRepresentation(BsonType.ObjectId)]
        public string MicrogridNodeId { get; set; } = null!;

        public double EnergyAmountKwh { get; set; }

        public DateTime TransactionTime { get; set; }

        public string Status { get; set; } = "Recorded";
    }
}
