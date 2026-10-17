using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace SmartSolar.Backend.Authorization
{
    public class RoleAuthorizationHandler : AuthorizationHandler<RoleRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            RoleRequirement requirement)
        {
            var user = context.User;
            var claimRole = user.FindFirstValue(ClaimTypes.Role) ?? user.FindFirstValue("role");

            if (!string.IsNullOrWhiteSpace(claimRole) && requirement.AllowedRoles.Contains(claimRole, StringComparer.OrdinalIgnoreCase))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
