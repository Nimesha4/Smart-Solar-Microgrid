// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: SmartSolarDatabaseSettings.cs
// Description: Strongly-typed configuration model for MongoDB connection strings and collections.
// ============================================================================

namespace SmartSolar.Backend.Models
{
    /// <summary>
    /// Configuration mapping for MongoDB connection strings and database collection names.
    /// </summary>
    public class SmartSolarDatabaseSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string UsersCollectionName { get; set; } = null!;
        public string MicrogridNodesCollectionName { get; set; } = null!;
        public string ReservationsCollectionName { get; set; } = null!;
         public string TransactionsCollectionName { get; set; } = null!;
    }
}
