using System;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
namespace SmartSolar.Backend.Services
{
    // Simple PBKDF2-based password hasher. Produces a string containing:
    // {iterations}.{base64Salt}.{base64Subkey}
    public static class PasswordHasher
    {
        private const int SaltSize = 16; // 128 bit
        private const int SubkeySize = 32; // 256 bit
        private const int IterationCount = 10000;

        public static string HashPassword(string password)
        {
            using var rng = RandomNumberGenerator.Create();
            var salt = new byte[SaltSize];
            rng.GetBytes(salt);

            using var deriveBytes = new Rfc2898DeriveBytes(password, salt, IterationCount, HashAlgorithmName.SHA256);
            var subkey = deriveBytes.GetBytes(SubkeySize);

            return $"{IterationCount}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(subkey)}";
        }

        public static bool VerifyHashedPassword(string hashedPassword, string providedPassword)
        {
            if (string.IsNullOrEmpty(hashedPassword))
                return false;

            var parts = hashedPassword.Split('.', 3);
            if (parts.Length != 3)
                return false;

            if (!int.TryParse(parts[0], out var iterations))
                return false;

            var salt = Convert.FromBase64String(parts[1]);
            var expectedSubkey = Convert.FromBase64String(parts[2]);

            using var deriveBytes = new Rfc2898DeriveBytes(providedPassword, salt, iterations, HashAlgorithmName.SHA256);
            var actualSubkey = deriveBytes.GetBytes(expectedSubkey.Length);

            return CryptographicOperations.FixedTimeEquals(actualSubkey, expectedSubkey);
        }
    }
}
