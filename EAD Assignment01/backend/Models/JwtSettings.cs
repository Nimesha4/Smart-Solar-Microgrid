namespace SmartSolar.Backend.Models
{
    public class JwtSettings
    {
        public string Key { get; set; } = "";
        public string Issuer { get; set; } = "SmartSolarMicrogrid";
        public string Audience { get; set; } = "SmartSolarMicrogridUsers";
        public int ExpiryMinutes { get; set; } = 180;
    }
}
