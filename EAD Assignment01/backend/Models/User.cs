// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: User.cs
// Description: User entity model representing Backoffice, GridOperator, and Prosumer accounts.
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace SmartSolar.Backend.Models
{
    /// <summary>
    /// Represents a system user across all roles (Backoffice, GridOperator, Prosumer).
    /// Uses NIC as the unique primary key per assignment specification.
    /// </summary>
    public class User
    {
        // Use NIC as primary key for all users per assignment spec
        [BsonId]
        public string Nic { get; set; } = null!;

        [BsonElement("Name")]
        public string Name { get; set; } = null!;

        // Roles: Backoffice, GridOperator, Prosumer
        public string Role { get; set; } = null!;

        public string Email { get; set; } = null!;

        // JsonIgnore guarantees PasswordHash is never exposed in REST API responses
        [JsonIgnore]
        public string PasswordHash { get; set; } = null!;

        // IsActive helps deactivate Prosumers
        public bool IsActive { get; set; } = true;
    }
}
