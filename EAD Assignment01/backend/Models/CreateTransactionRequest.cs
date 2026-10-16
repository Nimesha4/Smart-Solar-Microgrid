namespace SmartSolar.Backend.Models
{
    public class CreateTransactionRequest
    {
        public string ReservationId { get; set; } = null!;
        public string QrCodeData { get; set; } = null!;
    }
}