using System.Security.Claims;

namespace FinalProject.Common
{
    public static class ClaimsPrincipalExtensions
    {
        public static string GetUserId(this ClaimsPrincipal user)
        {
            return user?.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        public static bool TryGetUserId(this ClaimsPrincipal user, out string userId)
        {
            userId = user?.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            return !string.IsNullOrEmpty(userId);
        }
    }
}
