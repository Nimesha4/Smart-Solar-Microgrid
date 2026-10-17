// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: UsersController.cs
// Description: REST Controller handling user registration, authentication, 
//              role verification, and profile management with NIC primary key.
// ============================================================================

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using SmartSolar.Backend.Validators;
namespace SmartSolar.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;

        // Constructor: Injects the central UserService instance
        public UsersController(UserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Retrieves all registered user accounts from MongoDB.
        /// </summary>
        [HttpGet]
        public async Task<List<User>> Get() =>
            await _userService.GetAsync();

        /// <summary>
        /// Retrieves a single user profile using their NIC as primary key.
        /// </summary>
        [HttpGet("{nic}")]
        public async Task<ActionResult<User>> Get(string nic)
        {
            var user = await _userService.GetAsync(nic);

            if (user is null)
                return NotFound();

            return user;
        }

        /// <summary>
        /// Registers a new user. Enforces Prosumer role on public signup and checks NIC uniqueness.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] UserRegisterDto newUser)
        {
            if (newUser == null ||
    string.IsNullOrWhiteSpace(newUser.Nic) ||
    string.IsNullOrWhiteSpace(newUser.Password))
            {
                return BadRequest(new
                {
                    message = "NIC and password are required."
                });
            }

            string cleanNic = newUser.Nic.Trim();

            if (!NicValidator.IsValid(cleanNic))
            {
                return BadRequest(new
                {
                    message = "Invalid NIC format. Use 9 digits followed by V/X, or 12 digits."
                });
            }

            var existing = await _userService.GetAsync(cleanNic);

            if (existing is not null)
            {
                return Conflict(new
                {
                    message = "User with this NIC already exists."
                });
            }
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

        /// <summary>
        /// Authenticates user credentials against PBKDF2 hashed password and ensures account is active.
        /// </summary>
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

            string cleanNic = login.Nic.Trim();

            if (!NicValidator.IsValid(cleanNic))
            {
                return BadRequest(new
                {
                    message = "Invalid NIC format."
                });
            }

            var user = await _userService.GetAsync(cleanNic);
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

        /// <summary>
        /// Updates profile information for an existing user while preserving security credentials.
        /// </summary>
        [HttpPut("{nic}")]
        public async Task<IActionResult> Put(string nic, User updatedUser)
        {
            if (!NicValidator.IsValid(nic))
            {
                return BadRequest(new
                {
                    message = "Invalid NIC format."
                });
            }

            if (updatedUser == null)
            {
                return BadRequest(new
                {
                    message = "User data is required."
                });
            }
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

        /// <summary>
        /// Deactivates a user account, preventing further logins until reactivated by Backoffice.
        /// </summary>
        [HttpPut("deactivate/{nic}")]
        public async Task<IActionResult> Deactivate(string nic)
        {
            var user = await _userService.GetAsync(nic);
            if (user is null)
                return NotFound();

            await _userService.DeactivateAsync(nic);
            return NoContent();
        }

        /// <summary>
        /// Reactivates a deactivated user account (Backoffice authorization).
        /// </summary>
        [HttpPut("activate/{nic}")]
        public async Task<IActionResult> Activate(string nic)
        {
            var user = await _userService.GetAsync(nic);
            if (user is null)
                return NotFound();

            await _userService.ActivateAsync(nic);
            return NoContent();
        }

        /// <summary>
        /// Permanently deletes a user profile from the system.
        /// </summary>
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
