// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: UserRegisterDto.cs
// Description: DTO transfer object for user account registration.
// ============================================================================

namespace SmartSolar.Backend.Models
{
    /// <summary>
    /// User registration transfer object encapsulating NIC primary key and initial account details.
    /// </summary>
    public class UserRegisterDto
    {
        // NIC used as primary key
        public string Nic { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string Email { get; set; } = null!;
        // Plaintext password comes from client for registration only
        public string Password { get; set; } = null!;
    }
}
