// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: TransactionsController.cs
// Description: REST Controller handling finalized power trading transactions,
//              performing QR verification against MongoDB reservation records.
// ============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartSolar.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly TransactionService _transactionService;
        private readonly ReservationService _reservationService;

        // Constructor: Injects transaction service and reservation service for cross-verification
        public TransactionsController(
            TransactionService transactionService,
            ReservationService reservationService)
        {
            _transactionService = transactionService;
            _reservationService = reservationService;
        }

        /// <summary>
        /// Retrieves all finalized energy transfer transactions from MongoDB.
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "BackofficeOrGridOperator")]
        public async Task<ActionResult<List<Transaction>>> Get()
        {
            var transactions = await _transactionService.GetAsync();
            return Ok(transactions);
        }

        /// <summary>
        /// Validates scanned QR token against reservation data and records the finalized energy transfer transaction.
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "GridOperatorOnly")]
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
            {
                return BadRequest("Invalid reservation ID.");
            }

            var reservation = await _reservationService
                .GetAsync(request.ReservationId);

            if (reservation == null)
            {
                return NotFound("Reservation not found.");
            }

            if (reservation.Status != "Approved")
            {
                return BadRequest(
                    "Only approved reservations can be recorded.");
            }

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
            {
                return Conflict(
                    "A transaction already exists for this reservation.");
            }

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

        /// <summary>
        /// Permanently removes a transaction record by its ObjectId.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = "BackofficeOnly")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return BadRequest("Invalid transaction ID.");
            }

            var transaction = await _transactionService.GetByIdAsync(id);

            if (transaction == null)
            {
                return NotFound("Transaction not found.");
            }

            var deleted = await _transactionService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound(
                    "Transaction could not be deleted because it was not found.");
            }

            return Ok(new
            {
                message = "Transaction deleted successfully.",
                id = id
            });
        }
    }
}
