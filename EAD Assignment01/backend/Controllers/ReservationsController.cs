// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: ReservationsController.cs
// Description: REST Controller managing Energy Slot Reservations, enforcing
//              core business logic (7-day advance booking window, 12-hour
//              notice for updates/cancellations, and secure QR dispatch).
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartSolar.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationsController : ControllerBase
    {
        private readonly ReservationService _reservationService;
        private readonly MicrogridNodeService _nodeService;
        private readonly UserService _userService;

        // Constructor: Injects central services for reservation logic, node availability, and prosumer validation
        public ReservationsController(
            ReservationService reservationService,
            MicrogridNodeService nodeService,
            UserService userService)
        {
            _reservationService = reservationService;
            _nodeService = nodeService;
            _userService = userService;
        }

        /// <summary>
        /// Retrieves all energy trading reservations across the microgrid network.
        /// </summary>
        [HttpGet]
        public async Task<List<Reservation>> Get() =>
            await _reservationService.GetAsync();

        /// <summary>
        /// Retrieves details of real-time energy slot capacity and battery availability for a given hub.
        /// </summary>
        [HttpGet("availability/{nodeId}")]
        public async Task<IActionResult> GetAvailability(string nodeId)
        {
            var hub = await _nodeService.GetAsync(nodeId);
            if (hub is null)
                return NotFound("Microgrid hub not found.");

            var reservations = await _reservationService.GetAsync();
            var activeBookings = reservations.FindAll(r => 
                r.MicrogridNodeId == nodeId && 
                (r.Status == "Pending" || r.Status == "Approved"));

            var totalActiveEnergy = 0.0;
            foreach (var b in activeBookings)
            {
                totalActiveEnergy += b.EnergyAmountKwh;
            }

            var remainingCapacity = Math.Max(0, hub.CapacityKwh - totalActiveEnergy);
            var remainingSlots = Math.Max(0, hub.AvailableBatterySlots - activeBookings.Count);

            return Ok(new
            {
                nodeId = hub.Id,
                nodeName = hub.Name,
                isActive = hub.IsActive,
                totalCapacityKwh = hub.CapacityKwh,
                allocatedEnergyKwh = totalActiveEnergy,
                remainingCapacityKwh = remainingCapacity,
                totalBatterySlots = hub.AvailableBatterySlots,
                activeReservationsCount = activeBookings.Count,
                availableBatterySlots = remainingSlots,
                hasAvailability = hub.IsActive && remainingCapacity > 0 && remainingSlots > 0
            });
        }

        /// <summary>
        /// Retrieves a specific reservation by its unique identifier.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Reservation>> Get(string id)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound("Reservation not found.");
            return res;
        }
        
        /// <summary>
        /// Retrieves all energy reservations associated with a specific Prosumer NIC.
        /// </summary>
        [HttpGet("prosumer/{nic}")]
        public async Task<List<Reservation>> GetByProsumer(string nic) =>
            await _reservationService.GetByProsumerAsync(nic);

        /// <summary>
        /// Creates a new energy drop-off booking. Enforces backend validation:
        /// active prosumer verification, target hub active state, battery slot availability,
        /// capacity threshold, and the 7-day future booking window rule.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Post(Reservation newRes)
        {
            if (newRes is null)
                return BadRequest("Reservation data is required.");

            // 1. Validate Prosumer account (must exist and be active)
            if (string.IsNullOrWhiteSpace(newRes.ProsumerNic))
                return BadRequest("Prosumer NIC is required.");

            var prosumer = await _userService.GetAsync(newRes.ProsumerNic);
            if (prosumer is null)
                return BadRequest($"Prosumer with NIC '{newRes.ProsumerNic}' was not found.");

            if (!prosumer.IsActive)
                return BadRequest("Deactivated prosumer accounts cannot reserve energy slots. Contact Backoffice.");

            // 2. Validate Target Microgrid Hub (must exist and be operational)
            if (string.IsNullOrWhiteSpace(newRes.MicrogridNodeId))
                return BadRequest("Target microgrid hub ID is required.");

            var hub = await _nodeService.GetAsync(newRes.MicrogridNodeId);
            if (hub is null)
                return BadRequest("Selected microgrid hub does not exist.");

            if (!hub.IsActive)
                return BadRequest("Cannot book slots at an inactive microgrid hub.");

            // 3. Validate Energy Trading Amount
            if (newRes.EnergyAmountKwh <= 0)
                return BadRequest("Energy amount must be greater than 0 kW/h.");

            if (newRes.EnergyAmountKwh > hub.CapacityKwh)
                return BadRequest($"Requested energy ({newRes.EnergyAmountKwh} kW/h) exceeds hub total capacity ({hub.CapacityKwh} kW/h).");

            // 4. Validate Battery Storage Slot Availability
            if (hub.AvailableBatterySlots <= 0)
                return BadRequest("Selected microgrid hub has no battery storage slots configured.");

            var existingReservations = await _reservationService.GetAsync();
            var activeHubReservations = existingReservations.FindAll(r =>
                r.MicrogridNodeId == newRes.MicrogridNodeId &&
                (r.Status == "Pending" || r.Status == "Approved"));

            if (activeHubReservations.Count >= hub.AvailableBatterySlots)
                return BadRequest("All battery slots at this hub are currently occupied or reserved.");

            // 5. Business Rule: Must be scheduled in the future and within 7 days
            if (newRes.ScheduledTime > DateTime.UtcNow.AddDays(7) || newRes.ScheduledTime <= DateTime.UtcNow)
                return BadRequest("Reservations must be scheduled in the future and within 7 days.");
                
            newRes.Status = "Pending";
            await _reservationService.CreateAsync(newRes);
            return CreatedAtAction(nameof(Get), new { id = newRes.Id }, newRes);
        }

        /// <summary>
        /// Modifies an existing energy reservation. Enforces the 12-hour advance notice rule,
        /// validates updated hub parameters, capacity limits, and prevents modification of finalized bookings.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(string id, Reservation updatedRes)
        {
            if (updatedRes is null)
                return BadRequest("Updated reservation payload cannot be empty.");

            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound("Reservation not found.");

            // Business Rule: Cannot modify already completed or cancelled reservations
            if (res.Status == "Completed" || res.Status == "Cancelled")
                return BadRequest($"Cannot modify a reservation that is already {res.Status}.");

            // Business Rule: Updates require at least 12 hours notice prior to scheduled time
            if ((res.ScheduledTime - DateTime.UtcNow).TotalHours < 12)
                return BadRequest("Updates require at least 12 hours notice prior to scheduled time.");

            // Validate updated energy amount
            if (updatedRes.EnergyAmountKwh <= 0)
                return BadRequest("Energy amount must be greater than 0 kW/h.");

            // Validate updated scheduled time if modified
            if (updatedRes.ScheduledTime != res.ScheduledTime)
            {
                if (updatedRes.ScheduledTime > DateTime.UtcNow.AddDays(7) || updatedRes.ScheduledTime <= DateTime.UtcNow)
                    return BadRequest("Reservations must be scheduled in the future and within 7 days.");
            }

            // Validate target hub if modified
            var targetNodeId = !string.IsNullOrWhiteSpace(updatedRes.MicrogridNodeId) ? updatedRes.MicrogridNodeId : res.MicrogridNodeId;
            var hub = await _nodeService.GetAsync(targetNodeId);
            if (hub is null)
                return BadRequest("Target microgrid hub does not exist.");

            if (!hub.IsActive)
                return BadRequest("Cannot transfer reservation to an inactive microgrid hub.");

            if (updatedRes.EnergyAmountKwh > hub.CapacityKwh)
                return BadRequest($"Requested energy ({updatedRes.EnergyAmountKwh} kW/h) exceeds hub capacity ({hub.CapacityKwh} kW/h).");

            updatedRes.Id = res.Id;
            updatedRes.ProsumerNic = res.ProsumerNic; // Preserve original prosumer identity
            await _reservationService.UpdateAsync(id, updatedRes);
            return NoContent();
        }
        
        /// <summary>
        /// Approves a pending reservation, verifies hub active status, and generates a cryptographically secure QR token.
        /// </summary>
        [HttpPut("approve/{id}")]
        public async Task<IActionResult> Approve(string id)
        {
            var res = await _reservationService.GetAsync(id);

            if (res is null)
                return NotFound("Reservation not found.");

            if (res.Status != "Pending")
                return BadRequest("Only pending reservations can be approved.");

            // Verify the hub is still active before approving
            var hub = await _nodeService.GetAsync(res.MicrogridNodeId);
            if (hub != null && !hub.IsActive)
                return BadRequest("Cannot approve reservation: the assigned microgrid hub is inactive.");

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
        public async Task<IActionResult> Complete(string id)
        {
            var res = await _reservationService.GetAsync(id);

            if (res is null)
                return NotFound("Reservation not found.");

            if (res.Status != "Approved")
                return BadRequest("Only approved reservations can be completed.");

            res.Status = "Completed";

            await _reservationService.UpdateAsync(id, res);

            return Ok(res);
        }

        /// <summary>
        /// Cancels an energy reservation. Enforces the 12-hour advance cancellation rule
        /// and prevents cancellation of completed transactions.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound("Reservation not found.");

            if (res.Status == "Completed")
                return BadRequest("Cannot cancel an energy reservation that has already been completed.");

            // Business Rule: Cancellations require at least 12 hours notice prior to scheduled time
            if ((res.ScheduledTime - DateTime.UtcNow).TotalHours < 12)
                return BadRequest("Cancellations require at least 12 hours notice.");

            await _reservationService.RemoveAsync(id);
            return NoContent();
        }
    }
}
