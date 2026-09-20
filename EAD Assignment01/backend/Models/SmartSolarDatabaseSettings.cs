namespace SmartSolar.Backend.Models
{
    // Database settings for MongoDB
    public class SmartSolarDatabaseSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string UsersCollectionName { get; set; } = null!;
        public string MicrogridNodesCollectionName { get; set; } = null!;
        public string ReservationsCollectionName { get; set; } = null!;
    }
}
