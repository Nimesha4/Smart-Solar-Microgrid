
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolar.Backend.Models
{
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
