// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: MicrogridNode.cs
// Description: Microgrid node entity representing solar grid hubs with capacity and GPS data.
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace SmartSolar.Backend.Models
{
    /// <summary>
    /// Represents a solar microgrid hub with GPS coordinates, capacity specs, and battery slots.
    /// </summary>
    public class MicrogridNode
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Name { get; set; } = null!;

        public double Latitude { get; set; }
        
        public double Longitude { get; set; }

        // Capacity in kW/h
        public double CapacityKwh { get; set; }

        // Available battery storage slots
        public int AvailableBatterySlots { get; set; }

        public bool IsActive { get; set; } = true;
        
        // Operational schedules (e.g. "08:00-18:00")
        public string OperatingSchedule { get; set; } = "00:00-23:59";
    }
}
