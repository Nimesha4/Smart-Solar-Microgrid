namespace SmartSolar.Backend.Models
{
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
