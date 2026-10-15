using System;
using System.Security.Cryptography;

namespace SmartSolar.Backend.Services
{
    // PBKDF2-based password hasher. Produces a string containing:
    // {iterations}.{base64Salt}.{base64Subkey}
    public static class PasswordHasher
    {
        private const int SaltSize = 16; // 128 bit
        private const int SubkeySize = 32; // 256 bit
        private const int IterationCount = 10000;

        public static string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var subkey = Rfc2898DeriveBytes.Pbkdf2(password, salt, IterationCount, HashAlgorithmName.SHA256, SubkeySize);

            return $"{IterationCount}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(subkey)}";
        }

        public static bool VerifyHashedPassword(string hashedPassword, string providedPassword)
        {
            if (string.IsNullOrEmpty(hashedPassword) || string.IsNullOrEmpty(providedPassword))
                return false;

            var parts = hashedPassword.Split('.', 3);
            if (parts.Length != 3)
            {
                // Fallback for unmigrated legacy plain-text password database records
                return CryptographicOperations.FixedTimeEquals(
                    System.Text.Encoding.UTF8.GetBytes(hashedPassword),
                    System.Text.Encoding.UTF8.GetBytes(providedPassword));
            }

            if (!int.TryParse(parts[0], out var iterations))
                return false;

            byte[] salt;
            byte[] expectedSubkey;

            try
            {
                salt = Convert.FromBase64String(parts[1]);
                expectedSubkey = Convert.FromBase64String(parts[2]);
            }
            catch
            {
                return false;
            }

            var actualSubkey = Rfc2898DeriveBytes.Pbkdf2(providedPassword, salt, iterations, HashAlgorithmName.SHA256, expectedSubkey.Length);

            return CryptographicOperations.FixedTimeEquals(actualSubkey, expectedSubkey);
        }
    }
}
