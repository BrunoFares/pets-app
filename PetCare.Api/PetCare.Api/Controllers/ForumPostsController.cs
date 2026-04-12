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
[Authorize]
public class ForumPostsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ForumPostsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var me = TryGetCurrentUserId();
        var posts = await _db.ForumPosts
            .Include(p => p.User)
            .Include(p => p.Attachments)
            .Include(p => p.Replies)
            .Include(p => p.Bookmarks)
            .Where(p => !p.IsAReply)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(posts.Select(p => ToResponse(p, me)));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var me = TryGetCurrentUserId();
        var post = await _db.ForumPosts
            .Include(p => p.User)
            .Include(p => p.Attachments)
            .Include(p => p.Replies)
            .Include(p => p.Bookmarks)
            .FirstOrDefaultAsync(p => p.Id == id);

        return post is null ? NotFound() : Ok(ToResponse(post, me));
    }

    [HttpGet("{id:guid}/replies")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReplies(Guid id)
    {
        var me = TryGetCurrentUserId();
        var replies = await _db.ForumPosts
            .Include(p => p.User)
            .Include(p => p.Attachments)
            .Include(p => p.Bookmarks)
            .Where(p => p.ReplyingToPostId == id)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();

        return Ok(replies.Select(r => ToResponse(r, me)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateForumPostRequest request)
    {
        var me = User.GetUserId();
        var post = new ForumPostModel
        {
            Id = Guid.NewGuid(),
            UserId = me,
            Content = request.Content.Trim(),
            IsAReply = false,
            CreatedAt = DateTimeOffset.UtcNow,
            Attachments = (request.Attachments ?? new List<string>())
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => new ForumPostAttachmentModel { Url = a.Trim() })
                .ToList()
        };

        _db.ForumPosts.Add(post);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = post.Id }, new { post.Id });
    }

    [HttpPost("{id:guid}/reply")]
    public async Task<IActionResult> Reply(Guid id, [FromBody] ReplyToForumPostRequest request)
    {
        var me = User.GetUserId();
        var parentExists = await _db.ForumPosts.AnyAsync(p => p.Id == id);
        if (!parentExists) return NotFound(new { message = "Parent post not found." });

        var post = new ForumPostModel
        {
            Id = Guid.NewGuid(),
            UserId = me,
            Content = request.Content.Trim(),
            IsAReply = true,
            ReplyingToPostId = id,
            CreatedAt = DateTimeOffset.UtcNow,
            Attachments = (request.Attachments ?? new List<string>())
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => new ForumPostAttachmentModel { Url = a.Trim() })
                .ToList()
        };

        _db.ForumPosts.Add(post);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = post.Id }, new { post.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateForumPostRequest request)
    {
        var me = User.GetUserId();
        var post = await _db.ForumPosts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (post is null) return NotFound();

        post.Content = request.Content.Trim();
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Post updated." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var me = User.GetUserId();
        var post = await _db.ForumPosts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (post is null) return NotFound();

        _db.ForumPosts.Remove(post);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private long? TryGetCurrentUserId()
    {
        if (!User.Identity?.IsAuthenticated ?? true) return null;
        return User.GetUserId();
    }

    private static ForumPostResponse ToResponse(ForumPostModel post, long? currentUserId) => new(
        post.Id,
        post.UserId,
        post.User.Name ?? post.User.Username,
        post.Content,
        post.Attachments.Select(a => a.Url).ToList(),
        post.CreatedAt,
        post.UpdatedAt,
        post.IsAReply,
        post.ReplyingToPostId,
        post.Replies.Count,
        currentUserId.HasValue && post.Bookmarks.Any(b => b.UserId == currentUserId.Value)
    );
}
