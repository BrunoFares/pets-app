using PetCare.Api.Data;
using PetCare.Api.Model;

namespace PetCare.Api.Services;

public sealed class AdminAuditLogger
{
    private readonly AppDbContext _db;

    public AdminAuditLogger(AppDbContext db)
    {
        _db = db;
    }

    public void Log(long adminUserId, string actionType, string targetType, string targetId, string description, string? reason = null)
    {
        _db.AdminActionLogs.Add(new AdminActionLog
        {
            AdminUserId = adminUserId,
            ActionType = actionType,
            TargetType = targetType,
            TargetId = targetId,
            Description = description,
            Reason = reason,
            CreatedAt = DateTimeOffset.UtcNow
        });
    }
}
