// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: NodesController.cs
// Description: REST Controller managing Microgrid Nodes (Solar Grid Hubs),
//              including capacity specs, battery slots, GPS coordinates,
//              and reservation-dependent deactivation business rules.
// ============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartSolar.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
        [AllowAnonymous]
        public async Task<List<MicrogridNode>> Get() =>
            await _nodeService.GetAsync();

        /// <summary>
        /// Retrieves details of a specific microgrid hub by its unique ID.
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<MicrogridNode>> Get(string id)
        {
            var node = await _nodeService.GetAsync(id);

            if (node is null)
                return NotFound();

            return node;
        }

        /// <summary>
        /// Registers a new microgrid hub with GPS coordinates, capacity, and available battery slots.
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "BackofficeOnly")]
        public async Task<IActionResult> Post(MicrogridNode newNode)
        {
            await _nodeService.CreateAsync(newNode);
            return CreatedAtAction(nameof(Get), new { id = newNode.Id }, newNode);
        }

        /// <summary>
        /// Updates an existing microgrid hub's parameters (capacity, slots, schedule, or coordinates).
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Policy = "BackofficeOnly")]
        public async Task<IActionResult> Put(string id, MicrogridNode updatedNode)
        {
            var node = await _nodeService.GetAsync(id);
            if (node is null)
                return NotFound();

            updatedNode.Id = node.Id;
            await _nodeService.UpdateAsync(id, updatedNode);
            return NoContent();
        }

        /// <summary>
        /// Deactivates a microgrid hub. Enforces assignment rule: blocks deactivation if active reservations exist.
        /// </summary>
        [HttpPut("deactivate/{id}")]
        [Authorize(Policy = "BackofficeOnly")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var node = await _nodeService.GetAsync(id);
            if (node is null)
                return NotFound();

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
        /// Removes a microgrid hub record permanently from the database.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = "BackofficeOnly")]
        public async Task<IActionResult> Delete(string id)
        {
            var node = await _nodeService.GetAsync(id);
            if (node is null)
                return NotFound();

            await _nodeService.RemoveAsync(id);
            return NoContent();
        }
    }
}
