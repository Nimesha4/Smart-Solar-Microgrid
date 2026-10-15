using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace SmartSolar.Backend.Models
{
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
