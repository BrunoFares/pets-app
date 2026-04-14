using System.Security.Claims;

namespace PetCare.Api.Security;

public static class UserClaimsExtensions
{
    public static long GetUserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (!long.TryParse(raw, out var userId))
        {
            throw new UnauthorizedAccessException("Missing or invalid user id claim.");
        }

        return userId;
    }
}
