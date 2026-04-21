using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.Model;

namespace PetCare.Api.Security;

public sealed class UserAccessRequirement : IAuthorizationRequirement;

public sealed class AdminAccessRequirement : IAuthorizationRequirement
{
    public AdminAccessRequirement(params AdminRole[] allowedRoles)
    {
        AllowedRoles = allowedRoles;
    }

    public IReadOnlyList<AdminRole> AllowedRoles { get; }
}

public sealed class UserAccessHandler : AuthorizationHandler<UserAccessRequirement>
{
    private readonly AppDbContext _db;

    public UserAccessHandler(AppDbContext db)
    {
        _db = db;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, UserAccessRequirement requirement)
    {
        var actorType = context.User.FindFirst(AuthConstants.Claims.ActorType)?.Value;
        if (!string.Equals(actorType, AuthConstants.ActorTypes.User, StringComparison.Ordinal))
        {
            return;
        }

        var rawUserId = context.User.FindFirst(AuthConstants.Claims.UserId)?.Value
            ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!long.TryParse(rawUserId, out var userId))
        {
            return;
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is not null && !user.IsBanned)
        {
            context.Succeed(requirement);
        }
    }
}

public sealed class AdminAccessHandler : AuthorizationHandler<AdminAccessRequirement>
{
    private readonly AppDbContext _db;

    public AdminAccessHandler(AppDbContext db)
    {
        _db = db;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, AdminAccessRequirement requirement)
    {
        var actorType = context.User.FindFirst(AuthConstants.Claims.ActorType)?.Value;
        if (!string.Equals(actorType, AuthConstants.ActorTypes.Admin, StringComparison.Ordinal))
        {
            return;
        }

        var rawAdminId = context.User.FindFirst(AuthConstants.Claims.AdminId)?.Value
            ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!long.TryParse(rawAdminId, out var adminId))
        {
            return;
        }

        var admin = await _db.AdminUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == adminId);

        if (admin is null || !admin.IsActive)
        {
            return;
        }

        if (requirement.AllowedRoles.Count == 0 || requirement.AllowedRoles.Contains(admin.Role))
        {
            context.Succeed(requirement);
        }
    }
}
