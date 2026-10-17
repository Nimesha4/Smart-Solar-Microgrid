// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: NodesController.cs
// Description: REST Controller managing Microgrid Nodes (Solar Grid Hubs),
//              including capacity specs, battery slots, GPS coordinates,
//              and reservation-dependent deactivation business rules.
// ============================================================================

using Microsoft.AspNetCore.Mvc;
using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartSolar.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NodesController : ControllerBase
    {
        private readonly MicrogridNodeService _nodeService;
        private readonly ReservationService _reservationService;

        // Constructor: Injects node repository service and reservation service for rule validation
        public NodesController(MicrogridNodeService nodeService, ReservationService reservationService)
        {
            _nodeService = nodeService;
            _reservationService = reservationService;
        }

        /// <summary>
        /// Retrieves all registered solar microgrid hubs.
        /// </summary>
        [HttpGet]
        public async Task<List<MicrogridNode>> Get() =>
            await _nodeService.GetAsync();

        /// <summary>
        /// Retrieves details of a specific microgrid hub by its unique ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<MicrogridNode>> Get(string id)
        {
            var node = await _nodeService.GetAsync(id);

            if (node is null)
                return NotFound();

            return node;
        }

        /// <summary>
        /// Registers a new microgrid hub with GPS coordinates, capacity, and available battery slots.
        /// Enforces backend validation: required name, positive capacity, non-negative slots, and valid GPS coordinates.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Post(MicrogridNode newNode)
        {
            if (newNode is null)
                return BadRequest("Microgrid hub payload cannot be empty.");

            if (string.IsNullOrWhiteSpace(newNode.Name))
                return BadRequest("Hub name is required and cannot be empty.");

            if (newNode.CapacityKwh <= 0)
                return BadRequest("Hub energy capacity must be greater than 0 kW/h.");

            if (newNode.AvailableBatterySlots < 0)
                return BadRequest("Available battery slots cannot be negative.");

            if (newNode.Latitude < -90 || newNode.Latitude > 90)
                return BadRequest("Latitude must be between -90 and 90 degrees.");

            if (newNode.Longitude < -180 || newNode.Longitude > 180)
                return BadRequest("Longitude must be between -180 and 180 degrees.");

            if (string.IsNullOrWhiteSpace(newNode.OperatingSchedule))
                newNode.OperatingSchedule = "08:00-18:00";

            await _nodeService.CreateAsync(newNode);
            return CreatedAtAction(nameof(Get), new { id = newNode.Id }, newNode);
        }

        /// <summary>
        /// Updates an existing microgrid hub's parameters (capacity, slots, schedule, or coordinates).
        /// Enforces backend validation on all parameters and blocks deactivation if active reservations exist.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(string id, MicrogridNode updatedNode)
        {
            if (updatedNode is null)
                return BadRequest("Updated hub payload cannot be empty.");

            var node = await _nodeService.GetAsync(id);
            if (node is null)
                return NotFound("Microgrid hub not found.");

            if (string.IsNullOrWhiteSpace(updatedNode.Name))
                return BadRequest("Hub name is required and cannot be empty.");

            if (updatedNode.CapacityKwh <= 0)
                return BadRequest("Hub energy capacity must be greater than 0 kW/h.");

            if (updatedNode.AvailableBatterySlots < 0)
                return BadRequest("Available battery slots cannot be negative.");

            if (updatedNode.Latitude < -90 || updatedNode.Latitude > 90)
                return BadRequest("Latitude must be between -90 and 90 degrees.");

            if (updatedNode.Longitude < -180 || updatedNode.Longitude > 180)
                return BadRequest("Longitude must be between -180 and 180 degrees.");

            if (string.IsNullOrWhiteSpace(updatedNode.OperatingSchedule))
                updatedNode.OperatingSchedule = "08:00-18:00";

            // Business Rule: If updating status from active to inactive, verify no active reservations exist
            if (node.IsActive && !updatedNode.IsActive)
            {
                var reservations = await _reservationService.GetAsync();
                var hasActiveReservations = reservations.Exists(r => 
                    r.MicrogridNodeId == id && 
                    (r.Status == "Pending" || r.Status == "Approved"));
                    
                if (hasActiveReservations)
                    return BadRequest("Cannot deactivate a node with active energy reservations.");
            }

            updatedNode.Id = node.Id;
            await _nodeService.UpdateAsync(id, updatedNode);
            return NoContent();
        }

        /// <summary>
        /// Deactivates a microgrid hub. Enforces assignment rule: blocks deactivation if active reservations exist.
        /// </summary>
        [HttpPut("deactivate/{id}")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var node = await _nodeService.GetAsync(id);
            if (node is null)
                return NotFound("Microgrid hub not found.");

            // Business Rule: Deactivation is blocked if active energy reservations exist
            var reservations = await _reservationService.GetAsync();
            var hasActiveReservations = reservations.Exists(r => 
                r.MicrogridNodeId == id && 
                (r.Status == "Pending" || r.Status == "Approved"));
                
            if (hasActiveReservations)
                return BadRequest("Cannot deactivate a node with active energy reservations.");

            await _nodeService.DeactivateAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Removes a microgrid hub record permanently. Enforces rule: blocks deletion if active reservations exist.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var node = await _nodeService.GetAsync(id);
            if (node is null)
                return NotFound("Microgrid hub not found.");

            // Business Rule: Node deletion is blocked if active energy reservations exist
            var reservations = await _reservationService.GetAsync();
            var hasActiveReservations = reservations.Exists(r => 
                r.MicrogridNodeId == id && 
                (r.Status == "Pending" || r.Status == "Approved"));
                
            if (hasActiveReservations)
                return BadRequest("Cannot delete a node with active energy reservations.");

            await _nodeService.RemoveAsync(id);
            return NoContent();
        }
    }
}
