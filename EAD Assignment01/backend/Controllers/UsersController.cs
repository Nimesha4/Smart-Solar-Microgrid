using Microsoft.AspNetCore.Mvc;
using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartSolar.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;

        public UsersController(UserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<List<User>> Get() =>
            await _userService.GetAsync();

        [HttpGet("{nic}")]
        public async Task<ActionResult<User>> Get(string nic)
        {
            var user = await _userService.GetAsync(nic);

            if (user is null)
                return NotFound();

            return user;
        }

        [HttpPost]
        public async Task<IActionResult> Post(User newUser)
        {
            await _userService.CreateAsync(newUser);
            return CreatedAtAction(nameof(Get), new { nic = newUser.Nic }, newUser);
        }

        [HttpPut("{nic}")]
        public async Task<IActionResult> Put(string nic, User updatedUser)
        {
            var user = await _userService.GetAsync(nic);
            if (user is null)
                return NotFound();

            updatedUser.Nic = user.Nic;
            await _userService.UpdateAsync(nic, updatedUser);
            return NoContent();
        }
        
        [HttpPut("deactivate/{nic}")]
        public async Task<IActionResult> Deactivate(string nic)
        {
            var user = await _userService.GetAsync(nic);
            if (user is null)
                return NotFound();

            await _userService.DeactivateAsync(nic);
            return NoContent();
        }
        
        [HttpPut("activate/{nic}")]
        public async Task<IActionResult> Activate(string nic)
        {
            var user = await _userService.GetAsync(nic);
            if (user is null)
                return NotFound();

            await _userService.ActivateAsync(nic);
            return NoContent();
        }

        [HttpDelete("{nic}")]
        public async Task<IActionResult> Delete(string nic)
        {
            var user = await _userService.GetAsync(nic);
            if (user is null)
                return NotFound();

            await _userService.RemoveAsync(nic);
            return NoContent();
        }
    }
}
