using Microsoft.AspNetCore.Http;
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
        public async Task<IActionResult> Post([FromBody] UserRegisterDto newUser)
        {
            if (newUser == null ||
                string.IsNullOrWhiteSpace(newUser.Nic) ||
                string.IsNullOrWhiteSpace(newUser.Password))
            {
                return BadRequest(new { message = "NIC and password are required." });
            }

            var cleanNic = newUser.Nic.Trim();
            var existing = await _userService.GetAsync(cleanNic);
            if (existing is not null)
                return Conflict(new { message = "User with this NIC already exists." });

            // Public registration enforces Prosumer role on the server
            var user = new User
            {
                Nic = cleanNic,
                Name = newUser.Name,
                Role = "Prosumer",
                Email = newUser.Email,
                PasswordHash = PasswordHasher.HashPassword(newUser.Password),
                IsActive = true
            };

            await _userService.CreateAsync(user);
            return CreatedAtAction(
                nameof(Get),
                new { nic = user.Nic },
                new
                {
                    nic = user.Nic,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role,
                    isActive = user.IsActive
                }
            );
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto login)
        {
            if (login == null ||
                string.IsNullOrWhiteSpace(login.Nic) ||
                string.IsNullOrEmpty(login.Password))
            {
                return BadRequest(new
                {
                    message = "NIC and password are required."
                });
            }

            var user = await _userService.GetAsync(login.Nic.Trim());

            if (user == null ||
                !PasswordHasher.VerifyHashedPassword(
                    user.PasswordHash,
                    login.Password))
            {
                return Unauthorized(new
                {
                    message = "Invalid NIC or password."
                });
            }

            if (!user.IsActive)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Account is deactivated. Contact Backoffice."
                });
            }

            return Ok(new
            {
                message = "Login successful",
                nic = user.Nic,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                isActive = user.IsActive
            });
        }

        [HttpPut("{nic}")]
        public async Task<IActionResult> Put(string nic, User updatedUser)
        {
            var user = await _userService.GetAsync(nic);
            if (user is null)
                return NotFound();

            // Preserve existing password hash and NIC
            updatedUser.Nic = user.Nic;
            if (string.IsNullOrEmpty(updatedUser.PasswordHash))
            {
                updatedUser.PasswordHash = user.PasswordHash;
            }

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
