using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class ChatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ChatsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyChatHistory()
    {
        var me = User.GetUserId();
        var items = await _db.ChatSessions
            .Where(c => c.UserId == me)
            .Include(c => c.Messages)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(items.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var me = User.GetUserId();
        var session = await _db.ChatSessions
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == me);

        return session is null ? NotFound() : Ok(ToResponse(session));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateChatRequest request)
    {
        var me = User.GetUserId();
        var now = DateTimeOffset.UtcNow;

        var session = new ChatSessionModel
        {
            Id = Guid.NewGuid(),
            UserId = me,
            CreatedAt = now,
            UpdatedAt = now,
            Messages = (request.Discussion ?? new List<CreateChatMessageRequest>())
                .Select(m => new ChatMessageModel
                {
                    Role = m.Role,
                    Content = m.Content.Trim(),
                    CreatedAt = now
                })
                .ToList()
        };

        _db.ChatSessions.Add(session);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = session.Id }, new { session.Id });
    }

    [HttpPut("{id:guid}/append")]
    public async Task<IActionResult> Append(Guid id, [FromBody] AppendChatMessagesRequest request)
    {
        var me = User.GetUserId();
        var session = await _db.ChatSessions.FirstOrDefaultAsync(c => c.Id == id && c.UserId == me);
        if (session is null) return NotFound();

        var now = DateTimeOffset.UtcNow;
        var messages = (request.Messages ?? new List<CreateChatMessageRequest>())
            .Where(m => !string.IsNullOrWhiteSpace(m.Content))
            .Select(m => new ChatMessageModel
            {
                ChatSessionId = session.Id,
                Role = m.Role,
                Content = m.Content.Trim(),
                CreatedAt = now
            })
            .ToList();

        if (messages.Count == 0) return BadRequest(new { message = "No messages to append." });

        _db.ChatMessages.AddRange(messages);
        session.UpdatedAt = now;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Messages appended.", appended = messages.Count });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var me = User.GetUserId();
        var session = await _db.ChatSessions.FirstOrDefaultAsync(c => c.Id == id && c.UserId == me);
        if (session is null) return NotFound();

        _db.ChatSessions.Remove(session);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static ChatResponse ToResponse(ChatSessionModel session) => new(
        session.Id,
        session.UserId,
        session.Messages.OrderBy(m => m.CreatedAt).Select(m => new ChatMessageResponse(m.Id, m.Role, m.Content, m.CreatedAt)).ToList(),
        session.CreatedAt,
        session.UpdatedAt
    );
}
