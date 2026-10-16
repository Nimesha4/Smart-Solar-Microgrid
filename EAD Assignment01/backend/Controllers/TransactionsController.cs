
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;

namespace SmartSolar.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly TransactionService _transactionService;
        private readonly ReservationService _reservationService;

        public TransactionsController(
            TransactionService transactionService,
            ReservationService reservationService)
        {
            _transactionService = transactionService;
            _reservationService = reservationService;
        }

        [HttpGet]
        public async Task<List<Transaction>> Get() =>
            await _transactionService.GetAsync();

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateTransactionRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.ReservationId) ||
                string.IsNullOrWhiteSpace(request.QrCodeData))
            {
                return BadRequest(
                    "Reservation ID and QR token are required.");
            }

            if (!ObjectId.TryParse(request.ReservationId, out _))
                return BadRequest("Invalid reservation ID.");

            var reservation = await _reservationService
                .GetAsync(request.ReservationId);

            if (reservation == null)
                return NotFound("Reservation not found.");

            if (reservation.Status != "Approved")
                return BadRequest(
                    "Only approved reservations can be recorded.");

            if (string.IsNullOrWhiteSpace(reservation.QrCodeData) ||
                !string.Equals(
                    reservation.QrCodeData,
                    request.QrCodeData,
                    StringComparison.Ordinal))
            {
                return BadRequest("Invalid QR token.");
            }

            var existing = await _transactionService
                .GetByReservationIdAsync(reservation.Id!);

            if (existing != null)
                return Conflict(
                    "A transaction already exists for this reservation.");

            var transaction = new Transaction
            {
                ReservationId = reservation.Id!,
                ProsumerNic = reservation.ProsumerNic,
                MicrogridNodeId = reservation.MicrogridNodeId,
                EnergyAmountKwh = reservation.EnergyAmountKwh,
                TransactionTime = DateTime.UtcNow,
                Status = "Recorded"
            };

            await _transactionService.CreateAsync(transaction);

            return Created(
                $"/api/transactions/{transaction.Id}",
                transaction);
        }
    }
}
