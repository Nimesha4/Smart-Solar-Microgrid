// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: ReservationsController.cs
// Description: REST Controller managing Energy Slot Reservations, enforcing
//              core business logic (7-day advance booking window, 12-hour
//              notice for updates/cancellations, and secure QR dispatch).
// ============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
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
    public class ReservationsController : ControllerBase
    {
        private readonly ReservationService _reservationService;

        // Constructor: Injects central ReservationService
        public ReservationsController(ReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        /// <summary>
        /// Retrieves all energy trading reservations across the microgrid network.
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "BackofficeOrGridOperator")]
        public async Task<List<Reservation>> Get() =>
            await _reservationService.GetAsync();

        /// <summary>
        /// Retrieves a specific reservation by its unique identifier.
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<Reservation>> Get(string id)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound();

            var currentUserNic = User.Claims.FirstOrDefault(c => c.Type == "nic")?.Value;
            var isAdmin = User.IsInRole("Backoffice") || User.IsInRole("GridOperator");
            if (!isAdmin && !string.Equals(currentUserNic, res.ProsumerNic, StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            return res;
        }
        
        /// <summary>
        /// Retrieves all energy reservations associated with a specific Prosumer NIC.
        /// </summary>
        [HttpGet("prosumer/{nic}")]
        [Authorize]
        public async Task<List<Reservation>> GetByProsumer(string nic)
        {
            var currentUserNic = User.Claims.FirstOrDefault(c => c.Type == "nic")?.Value;
            var isAdmin = User.IsInRole("Backoffice") || User.IsInRole("GridOperator");
            if (!isAdmin && !string.Equals(currentUserNic, nic, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException();
            }

            return await _reservationService.GetByProsumerAsync(nic);
        }

        /// <summary>
        /// Creates a new energy drop-off booking. Enforces the 7-day future booking window rule.
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "ProsumerOnly")]
        public async Task<IActionResult> Post(Reservation newRes)
        {
            // Business Rule: Must be scheduled in the future and within 7 days
            if (newRes.ScheduledTime > DateTime.UtcNow.AddDays(7) || newRes.ScheduledTime <= DateTime.UtcNow)
                return BadRequest("Reservations must be scheduled in the future and within 7 days.");
                
            newRes.Status = "Pending";
            await _reservationService.CreateAsync(newRes);
            return CreatedAtAction(nameof(Get), new { id = newRes.Id }, newRes);
        }

        /// <summary>
        /// Modifies an existing energy reservation. Enforces the 12-hour advance notice rule.
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Put(string id, Reservation updatedRes)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound();

            var currentUserNic = User.Claims.FirstOrDefault(c => c.Type == "nic")?.Value;
            var isAdmin = User.IsInRole("Backoffice") || User.IsInRole("GridOperator");
            if (!isAdmin && !string.Equals(currentUserNic, res.ProsumerNic, StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            // Business Rule: Updates require at least 12 hours notice prior to scheduled time
            if ((res.ScheduledTime - DateTime.UtcNow).TotalHours < 12)
                return BadRequest("Updates require at least 12 hours notice.");

            updatedRes.Id = res.Id;
            await _reservationService.UpdateAsync(id, updatedRes);
            return NoContent();
        }
        
        /// <summary>
        /// Approves a pending reservation and generates a cryptographically secure QR token for physical check-in.
        /// </summary>
        [HttpPut("approve/{id}")]
        [Authorize(Policy = "GridOperatorOnly")]
        public async Task<IActionResult> Approve(string id)
        {
            var res = await _reservationService.GetAsync(id);

            if (res is null)
                return NotFound("Reservation not found.");

            if (res.Status != "Pending")
                return BadRequest(
                    "Only pending reservations can be approved.");

            res.Status = "Approved";

            // Generate a secure, 32-byte cryptographic QR token
            res.QrCodeData =
                Convert.ToHexString(
                    System.Security.Cryptography.RandomNumberGenerator
                        .GetBytes(32));

            await _reservationService.UpdateAsync(id, res);

            return Ok(res);
        }

        /// <summary>
        /// Marks an approved reservation as completed after successful QR verification at the physical station.
        /// </summary>
        [HttpPut("complete/{id}")]
        [Authorize(Policy = "GridOperatorOnly")]
        public async Task<IActionResult> Complete(string id)
        {
            var res = await _reservationService.GetAsync(id);

            if (res is null)
                return NotFound("Reservation not found.");

            if (res.Status != "Approved")
                return BadRequest(
                    "Only approved reservations can be completed.");

            res.Status = "Completed";

            await _reservationService.UpdateAsync(id, res);

            return Ok(res);
        }

        /// <summary>
        /// Cancels an energy reservation. Enforces the 12-hour advance cancellation rule.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(string id)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound();

            var currentUserNic = User.Claims.FirstOrDefault(c => c.Type == "nic")?.Value;
            var isAdmin = User.IsInRole("Backoffice") || User.IsInRole("GridOperator");
            if (!isAdmin && !string.Equals(currentUserNic, res.ProsumerNic, StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            // Business Rule: Cancellations require at least 12 hours notice prior to scheduled time
            if ((res.ScheduledTime - DateTime.UtcNow).TotalHours < 12)
                return BadRequest("Cancellations require at least 12 hours notice.");

            await _reservationService.RemoveAsync(id);
            return NoContent();
        }
    }
}
