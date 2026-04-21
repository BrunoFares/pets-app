using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/admin/action-logs")]
[Authorize(Policy = AuthConstants.Policies.AdminOnly)]
public class AdminActionLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminActionLogsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? adminUserId,
        [FromQuery] string? actionType,
        [FromQuery] string? targetType,
        [FromQuery] string? targetId,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1)
        {
            return BadRequest(new { message = "page must be greater than or equal to 1." });
        }

        if (pageSize < 1 || pageSize > 200)
        {
            return BadRequest(new { message = "pageSize must be between 1 and 200." });
        }

        var query = _db.AdminActionLogs
            .AsNoTracking()
            .Include(l => l.AdminUser)
            .AsQueryable();

        if (adminUserId.HasValue)
        {
            query = query.Where(l => l.AdminUserId == adminUserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(actionType))
        {
            var normalizedActionType = actionType.Trim();
            query = query.Where(l => l.ActionType == normalizedActionType);
        }

        if (!string.IsNullOrWhiteSpace(targetType))
        {
            var normalizedTargetType = targetType.Trim();
            query = query.Where(l => l.TargetType == normalizedTargetType);
        }

        if (!string.IsNullOrWhiteSpace(targetId))
        {
            var normalizedTargetId = targetId.Trim();
            query = query.Where(l => l.TargetId == normalizedTargetId);
        }

        if (from.HasValue)
        {
            query = query.Where(l => l.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(l => l.CreatedAt <= to.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .ThenByDescending(l => l.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AdminActionLogResponse(
                l.Id,
                l.AdminUserId,
                l.AdminUser.Username,
                l.ActionType,
                l.TargetType,
                l.TargetId,
                l.Description,
                l.Reason,
                l.CreatedAt
            ))
            .ToListAsync();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new AdminActionLogListResponse(items, page, pageSize, totalCount, totalPages));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var item = await _db.AdminActionLogs
            .AsNoTracking()
            .Include(l => l.AdminUser)
            .Where(l => l.Id == id)
            .Select(l => new AdminActionLogResponse(
                l.Id,
                l.AdminUserId,
                l.AdminUser.Username,
                l.ActionType,
                l.TargetType,
                l.TargetId,
                l.Description,
                l.Reason,
                l.CreatedAt
            ))
            .FirstOrDefaultAsync();

        return item is null ? NotFound() : Ok(item);
    }
}
