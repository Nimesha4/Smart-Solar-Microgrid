// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: PasswordHasher.cs
// Description: PBKDF2 cryptographic password hashing and verification utility.
// ============================================================================

using System;
using System.Security.Cryptography;

namespace SmartSolar.Backend.Services
{
    /// <summary>
    /// PBKDF2-based password hasher producing formatted hashes: {iterations}.{base64Salt}.{base64Subkey}
    /// </summary>
    public static class PasswordHasher
    {
        private const int SaltSize = 16; // 128 bit salt
        private const int SubkeySize = 32; // 256 bit derived key
        private const int IterationCount = 10000;

        /// <summary>
        /// Generates a cryptographically secure PBKDF2 hash with a random salt for a plaintext password.
        /// </summary>
        /// <param name="password">The plaintext password to hash.</param>
        /// <returns>Formatted string containing iterations, salt, and subkey.</returns>
        public static string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var subkey = Rfc2898DeriveBytes.Pbkdf2(password, salt, IterationCount, HashAlgorithmName.SHA256, SubkeySize);

            return $"{IterationCount}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(subkey)}";
        }

        /// <summary>
        /// Verifies a plaintext password against a stored PBKDF2 hash using constant-time comparison.
        /// </summary>
        /// <param name="hashedPassword">The stored password hash.</param>
        /// <param name="providedPassword">The user-provided plaintext password.</param>
        /// <returns>True if the password matches; otherwise, false.</returns>
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
