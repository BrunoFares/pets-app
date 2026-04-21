using System.Security.Claims;

namespace PetCare.Api.Security;

public static class UserClaimsExtensions
{
    public static long GetUserId(this ClaimsPrincipal user)
    {
        var actorType = user.FindFirstValue(AuthConstants.Claims.ActorType);
        if (!string.Equals(actorType, AuthConstants.ActorTypes.User, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Current token is not a user token.");
        }

        var raw = user.FindFirstValue(AuthConstants.Claims.UserId)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");
        if (!long.TryParse(raw, out var userId))
        {
            throw new UnauthorizedAccessException("Missing or invalid user id claim.");
        }

        return userId;
    }

    public static long GetAdminId(this ClaimsPrincipal user)
    {
        var actorType = user.FindFirstValue(AuthConstants.Claims.ActorType);
        if (!string.Equals(actorType, AuthConstants.ActorTypes.Admin, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Current token is not an admin token.");
        }

        var raw = user.FindFirstValue(AuthConstants.Claims.AdminId)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");
        if (!long.TryParse(raw, out var adminId))
        {
            throw new UnauthorizedAccessException("Missing or invalid admin id claim.");
        }

        return adminId;
    }
}
