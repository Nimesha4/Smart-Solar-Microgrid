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

        public ReservationsController(ReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        [HttpGet]
        public async Task<List<Reservation>> Get() =>
            await _reservationService.GetAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<Reservation>> Get(string id)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound();
            return res;
        }
        
        [HttpGet("prosumer/{nic}")]
        public async Task<List<Reservation>> GetByProsumer(string nic) =>
            await _reservationService.GetByProsumerAsync(nic);

        [HttpPost]
        public async Task<IActionResult> Post(Reservation newRes)
        {
            // Must be scheduled within 7 days
            if (newRes.ScheduledTime > DateTime.UtcNow.AddDays(7) || newRes.ScheduledTime <= DateTime.UtcNow)
                return BadRequest("Reservations must be scheduled in the future and within 7 days.");
                
            newRes.Status = "Pending";
            await _reservationService.CreateAsync(newRes);
            return CreatedAtAction(nameof(Get), new { id = newRes.Id }, newRes);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(string id, Reservation updatedRes)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound();

            // Updates require at least 12 hours notice
            if ((res.ScheduledTime - DateTime.UtcNow).TotalHours < 12)
                return BadRequest("Updates require at least 12 hours notice.");

            updatedRes.Id = res.Id;
            await _reservationService.UpdateAsync(id, updatedRes);
            return NoContent();
        }
        
        [HttpPut("approve/{id}")]
        public async Task<IActionResult> Approve(string id)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound();

            res.Status = "Approved";
            // Generate mock QR Code token
            res.QrCodeData = $"QR_{res.Id}_{Guid.NewGuid().ToString().Substring(0, 8)}";
            
            await _reservationService.UpdateAsync(id, res);
            return Ok(res);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var res = await _reservationService.GetAsync(id);
            if (res is null)
                return NotFound();

            // Cancellations require at least 12 hours notice
            if ((res.ScheduledTime - DateTime.UtcNow).TotalHours < 12)
                return BadRequest("Cancellations require at least 12 hours notice.");

            await _reservationService.RemoveAsync(id);
            return NoContent();
        }
    }
}
