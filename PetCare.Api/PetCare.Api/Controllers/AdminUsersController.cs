using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/admin/admin-users")]
[Authorize(Policy = AuthConstants.Policies.ManagerOnly)]
public class AdminUsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminUsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var admins = await _db.AdminUsers
            .AsNoTracking()
            .OrderBy(a => a.Username)
            .Select(a => new AdminUserListItemResponse(
                a.Id,
                a.Username,
                a.FirstName,
                a.LastName,
                a.Email,
                a.Role,
                a.IsActive,
                a.CreatedAt,
                a.UpdatedAt,
                a.LastLogin
            ))
            .ToListAsync();

        return Ok(admins);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var admin = await _db.AdminUsers
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new AdminUserDetailsResponse(
                a.Id,
                a.Username,
                a.FirstName,
                a.LastName,
                a.Email,
                a.Role,
                a.IsActive,
                a.CreatedAt,
                a.UpdatedAt,
                a.LastLogin
            ))
            .FirstOrDefaultAsync();

        return admin is null ? NotFound() : Ok(admin);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdminUserRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var username = request.Username.Trim();

        var (ok, errors) = PasswordValidator.Validate(request.Password, username, email, new PasswordPolicy(
            MinLength: 8,
            MaxLength: 64,
            RequireUpper: true,
            RequireLower: true,
            RequireDigit: true,
            RequireSpecial: true,
            DisallowedChars: new[] { ' ', '"', '\'', '\\' },
            DisallowWhitespace: true
        ));
        if (!ok)
        {
            return BadRequest(new { message = "Invalid password.", errors });
        }

        if (await _db.AdminUsers.AnyAsync(a => a.Email == email))
        {
            return Conflict(new { message = "Email already exists." });
        }

        if (await _db.AdminUsers.AnyAsync(a => a.Username == username))
        {
            return Conflict(new { message = "Username already exists." });
        }

        var now = DateTimeOffset.UtcNow;
        var admin = new AdminUser
        {
            Username = username,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Role = request.Role,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.AdminUsers.Add(admin);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = admin.Id }, new AdminUserDetailsResponse(
            admin.Id,
            admin.Username,
            admin.FirstName,
            admin.LastName,
            admin.Email,
            admin.Role,
            admin.IsActive,
            admin.CreatedAt,
            admin.UpdatedAt,
            admin.LastLogin
        ));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateAdminUserRequest request)
    {
        var admin = await _db.AdminUsers.FindAsync(id);
        if (admin is null)
        {
            return NotFound();
        }

        var me = User.GetAdminId();
        if (me == id)
        {
            if (!request.IsActive)
            {
                return BadRequest(new { message = "Managers cannot deactivate themselves." });
            }

            if (request.Role != AdminRole.Manager)
            {
                return BadRequest(new { message = "Managers cannot remove their own manager role." });
            }
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var username = request.Username.Trim();

        if (await _db.AdminUsers.AnyAsync(a => a.Id != id && a.Email == email))
        {
            return Conflict(new { message = "Email already exists." });
        }

        if (await _db.AdminUsers.AnyAsync(a => a.Id != id && a.Username == username))
        {
            return Conflict(new { message = "Username already exists." });
        }

        admin.Username = username;
        admin.FirstName = request.FirstName.Trim();
        admin.LastName = request.LastName.Trim();
        admin.Email = email;
        admin.Role = request.Role;
        admin.IsActive = request.IsActive;
        admin.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new AdminUserDetailsResponse(
            admin.Id,
            admin.Username,
            admin.FirstName,
            admin.LastName,
            admin.Email,
            admin.Role,
            admin.IsActive,
            admin.CreatedAt,
            admin.UpdatedAt,
            admin.LastLogin
        ));
    }

    [HttpPost("{id:long}/deactivate")]
    public async Task<IActionResult> Deactivate(long id)
    {
        var me = User.GetAdminId();
        if (me == id)
        {
            return BadRequest(new { message = "Managers cannot deactivate themselves." });
        }

        var admin = await _db.AdminUsers.FindAsync(id);
        if (admin is null)
        {
            return NotFound();
        }

        admin.IsActive = false;
        admin.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Admin deactivated." });
    }

    [HttpPost("{id:long}/activate")]
    public async Task<IActionResult> Activate(long id)
    {
        var admin = await _db.AdminUsers.FindAsync(id);
        if (admin is null)
        {
            return NotFound();
        }

        admin.IsActive = true;
        admin.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Admin activated." });
    }
}
