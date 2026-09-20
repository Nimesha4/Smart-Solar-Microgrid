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

        public NodesController(MicrogridNodeService nodeService, ReservationService reservationService)
        {
            _nodeService = nodeService;
            _reservationService = reservationService;
        }

        [HttpGet]
        public async Task<List<MicrogridNode>> Get() =>
            await _nodeService.GetAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<MicrogridNode>> Get(string id)
        {
            var node = await _nodeService.GetAsync(id);

            if (node is null)
                return NotFound();

            return node;
        }

        [HttpPost]
        public async Task<IActionResult> Post(MicrogridNode newNode)
        {
            await _nodeService.CreateAsync(newNode);
            return CreatedAtAction(nameof(Get), new { id = newNode.Id }, newNode);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(string id, MicrogridNode updatedNode)
        {
            var node = await _nodeService.GetAsync(id);
            if (node is null)
                return NotFound();

            updatedNode.Id = node.Id;
            await _nodeService.UpdateAsync(id, updatedNode);
            return NoContent();
        }

        [HttpPut("deactivate/{id}")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var node = await _nodeService.GetAsync(id);
            if (node is null)
                return NotFound();

            // Deactivation is blocked if active energy reservations exist
            var reservations = await _reservationService.GetAsync();
            var hasActiveReservations = reservations.Exists(r => 
                r.MicrogridNodeId == id && 
                (r.Status == "Pending" || r.Status == "Approved"));
                
            if (hasActiveReservations)
                return BadRequest("Cannot deactivate a node with active energy reservations.");

            await _nodeService.DeactivateAsync(id);
            return NoContent();
        }

        [HttpDelete("{id}")]
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
