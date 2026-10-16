using System.Text.RegularExpressions;

namespace SmartSolar.Backend.Validators
{
    /// <summary>
    /// Validates Sri Lankan National Identity Card (NIC) numbers.
    /// Supports old and new NIC formats.
    /// </summary>
    public static class NicValidator
    {
        private static readonly Regex OldNicPattern =
            new Regex(@"^[0-9]{9}[VvXx]$");

        private static readonly Regex NewNicPattern =
            new Regex(@"^[0-9]{12}$");

        /// <summary>
        /// Checks whether a NIC matches a supported format.
        /// </summary>
        public static bool IsValid(string? nic)
        {
            if (string.IsNullOrWhiteSpace(nic))
                return false;

            string cleanNic = nic.Trim();

            return OldNicPattern.IsMatch(cleanNic)
                || NewNicPattern.IsMatch(cleanNic);
        }
    }
}