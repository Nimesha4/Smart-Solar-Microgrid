// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: UserLoginDto.cs
// Description: DTO transfer object for user authentication using NIC and password.
// ============================================================================

namespace SmartSolar.Backend.Models
{
    /// <summary>
    /// User credentials transfer object for system authentication.
    /// </summary>
    public class UserLoginDto
    {
        public string Nic { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
