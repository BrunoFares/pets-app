namespace PetCare.Api.Model;

public class AppUser
{
    public long Id { get; set; }
    public string Username { get; set; } = default!;
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public bool EmailVerified { get; set; }
    public string? EmailVerificationTokenHash { get; set; }
    public DateTimeOffset? EmailVerificationTokenExpiresAt { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Description { get; set; }
    public bool IsBanned { get; set; }
    public bool IsApprovedPlaceOwner { get; set; }
    public DateTimeOffset? BannedAt { get; set; }
    public string? BanReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLogin { get; set; }

    public List<PetModel> Pets { get; set; } = new();
    public List<ConsultationModel> Consultations { get; set; } = new();
    public List<ForumPostModel> ForumPosts { get; set; } = new();
    public List<ForumPostBookmarkModel> BookmarkedPosts { get; set; } = new();
    public List<ForumPostLikeModel> LikedPosts { get; set; } = new();
    public List<PetPlaceReviewModel> PlaceReviews { get; set; } = new();
    public List<PetPlaceModel> OwnedPlaces { get; set; } = new();
    public List<PlaceOwnerApplicationModel> PlaceOwnerApplications { get; set; } = new();
    public List<ReportModel> SubmittedReports { get; set; } = new();
}
