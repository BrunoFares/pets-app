using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using PetCare.Api.Model;

namespace PetCare.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AdminActionLog> AdminActionLogs => Set<AdminActionLog>();
    public DbSet<SpeciesModel> Species => Set<SpeciesModel>();
    public DbSet<BreedModel> Breeds => Set<BreedModel>();
    public DbSet<PetModel> Pets => Set<PetModel>();
    public DbSet<ConsultationModel> Consultations => Set<ConsultationModel>();
    public DbSet<ForumPostModel> ForumPosts => Set<ForumPostModel>();
    public DbSet<ForumPostAttachmentModel> ForumPostAttachments => Set<ForumPostAttachmentModel>();
    public DbSet<ForumPostBookmarkModel> ForumPostBookmarks => Set<ForumPostBookmarkModel>();
    public DbSet<ForumPostLikeModel> ForumPostLikes => Set<ForumPostLikeModel>();
    public DbSet<PlaceOwnerApplicationModel> PlaceOwnerApplications => Set<PlaceOwnerApplicationModel>();
    public DbSet<PlaceOwnerApplicationImageModel> PlaceOwnerApplicationImages => Set<PlaceOwnerApplicationImageModel>();
    public DbSet<ReportModel> Reports => Set<ReportModel>();
    public DbSet<PetPlaceModel> PetPlaces => Set<PetPlaceModel>();
    public DbSet<PetPlaceImageModel> PetPlaceImages => Set<PetPlaceImageModel>();
    public DbSet<PetPlaceScheduleModel> PetPlaceSchedules => Set<PetPlaceScheduleModel>();
    public DbSet<PetPlaceReviewModel> PetPlaceReviews => Set<PetPlaceReviewModel>();
    public DbSet<VaccineRecordModel> VaccineRecords => Set<VaccineRecordModel>();
    public DbSet<IllnessRecordModel> IllnessRecords => Set<IllnessRecordModel>();
    public DbSet<MedicationRecordModel> MedicationRecords => Set<MedicationRecordModel>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.HasPostgresEnum<PetSex>(name: "pet_sex");

        b.Entity<AppUser>(e =>
        {
            e.ToTable("users", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Username).HasColumnName("username").HasMaxLength(100).IsRequired();
            e.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
            e.Property(x => x.EmailVerified).HasColumnName("email_verified").IsRequired().HasDefaultValue(false);
            e.Property(x => x.EmailVerificationTokenHash).HasColumnName("email_verification_token_hash");
            e.Property(x => x.EmailVerificationTokenExpiresAt).HasColumnName("email_verification_token_expires_at");
            e.Property(x => x.PasswordResetCodeHash).HasColumnName("password_reset_code_hash");
            e.Property(x => x.PasswordResetCodeExpiresAt).HasColumnName("password_reset_code_expires_at");
            e.Property(x => x.PendingNewEmail).HasColumnName("pending_new_email").HasMaxLength(320);
            e.Property(x => x.EmailChangeCodeHash).HasColumnName("email_change_code_hash");
            e.Property(x => x.EmailChangeCodeExpiresAt).HasColumnName("email_change_code_expires_at");
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(1024);
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(1000);
            e.Property(x => x.IsBanned).HasColumnName("is_banned").IsRequired().HasDefaultValue(false);
            e.Property(x => x.IsApprovedPlaceOwner).HasColumnName("is_approved_place_owner").IsRequired().HasDefaultValue(false);
            e.Property(x => x.BannedAt).HasColumnName("banned_at");
            e.Property(x => x.BanReason).HasColumnName("ban_reason").HasMaxLength(500);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.LastLogin).HasColumnName("last_login");

            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Username).IsUnique();
        });

        b.Entity<AdminUser>(e =>
        {
            e.ToTable("admin_users", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Username).HasColumnName("username").HasMaxLength(100).IsRequired();
            e.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
            e.Property(x => x.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.IsActive).HasColumnName("is_active").IsRequired().HasDefaultValue(true);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
            e.Property(x => x.LastLogin).HasColumnName("last_login");

            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Username).IsUnique();
        });

        b.Entity<AdminActionLog>(e =>
        {
            e.ToTable("admin_action_logs", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.AdminUserId).HasColumnName("admin_user_id").IsRequired();
            e.Property(x => x.ActionType).HasColumnName("action_type").HasMaxLength(100).IsRequired();
            e.Property(x => x.TargetType).HasColumnName("target_type").HasMaxLength(100).IsRequired();
            e.Property(x => x.TargetId).HasColumnName("target_id").HasMaxLength(100).IsRequired();
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(1000).IsRequired();
            e.Property(x => x.Reason).HasColumnName("reason").HasMaxLength(1000);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.AdminUser)
                .WithMany(x => x.ActionLogs)
                .HasForeignKey(x => x.AdminUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.AdminUserId);
            e.HasIndex(x => x.ActionType);
            e.HasIndex(x => x.TargetType);
            e.HasIndex(x => x.TargetId);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => new { x.AdminUserId, x.CreatedAt });
        });

        b.Entity<SpeciesModel>(e =>
        {
            e.ToTable("species", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();

            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<BreedModel>(e =>
        {
            e.ToTable("breeds", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.SpeciesId).HasColumnName("species_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();

            e.HasOne(x => x.Species)
             .WithMany(s => s.Breeds)
             .HasForeignKey(x => x.SpeciesId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.SpeciesId, x.Name }).IsUnique();
        });

        b.Entity<PetModel>(e =>
        {
            e.ToTable("pets", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
            e.Property(x => x.SpeciesId).HasColumnName("species_id");
            e.Property(x => x.BreedId).HasColumnName("breed_id");

            e.Property(x => x.Sex).HasColumnName("sex").HasColumnType("pet_sex");
            e.Property(x => x.BirthDate).HasColumnName("birth_date");
            e.Property(x => x.WeightKg).HasColumnName("weight_kg").HasPrecision(5, 2);
            e.Property(x => x.Color).HasColumnName("color").HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Neutered).HasColumnName("neutered");
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(1024);
            e.Property(x => x.Notes).HasColumnName("notes").HasMaxLength(2000);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasOne(x => x.User).WithMany(u => u.Pets).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Species).WithMany(s => s.Pets).HasForeignKey(x => x.SpeciesId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Breed).WithMany(br => br.Pets).HasForeignKey(x => x.BreedId).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.UserId, x.Name }).IsUnique();
            e.HasIndex(x => x.SpeciesId);
            e.HasIndex(x => x.BreedId);
        });

        b.Entity<PetPlaceModel>(e =>
        {
            e.ToTable("pet_places", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.OwnerUserId).HasColumnName("owner_user_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
            e.Property(x => x.Photo).HasColumnName("photo").HasMaxLength(1024);
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000);
            e.Property(x => x.AddressLine1).HasColumnName("address_line1").HasMaxLength(200).IsRequired();
            e.Property(x => x.AddressLine2).HasColumnName("address_line2").HasMaxLength(200);
            e.Property(x => x.City).HasColumnName("city").HasMaxLength(100).IsRequired();
            e.Property(x => x.Country).HasColumnName("country").HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Type).HasColumnName("type").HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Latitude).HasColumnName("lat").HasPrecision(9, 6);
            e.Property(x => x.Longitude).HasColumnName("lon").HasPrecision(9, 6);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.OwnerUser)
                .WithMany(x => x.OwnedPlaces)
                .HasForeignKey(x => x.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasIndex(x => x.OwnerUserId);
            e.HasIndex(x => x.Type);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => new { x.City, x.Country });
        });

        b.Entity<PetPlaceImageModel>(e =>
        {
            e.ToTable("pet_place_images", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.PetPlaceId).HasColumnName("pet_place_id").IsRequired();
            e.Property(x => x.Url).HasColumnName("url").HasMaxLength(1024).IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.PetPlace)
                .WithMany(x => x.Images)
                .HasForeignKey(x => x.PetPlaceId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.PetPlaceId);
            e.HasIndex(x => new { x.PetPlaceId, x.CreatedAt });
        });

        b.Entity<PetPlaceScheduleModel>(e =>
        {
            e.ToTable("pet_place_schedules", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.PetPlaceId).HasColumnName("pet_place_id");
            e.Property(x => x.DayOfWeek).HasColumnName("day_of_week").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.IsClosed).HasColumnName("is_closed").IsRequired();
            e.Property(x => x.OpenTime).HasColumnName("open_time").HasColumnType("time without time zone");
            e.Property(x => x.CloseTime).HasColumnName("close_time").HasColumnType("time without time zone");
            e.Property(x => x.BreakStartTime).HasColumnName("break_start_time").HasColumnType("time without time zone");
            e.Property(x => x.BreakEndTime).HasColumnName("break_end_time").HasColumnType("time without time zone");

            e.HasOne(x => x.PetPlace)
                .WithMany(x => x.Schedules)
                .HasForeignKey(x => x.PetPlaceId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => new { x.PetPlaceId, x.DayOfWeek }).IsUnique();
        });

        b.Entity<PetPlaceReviewModel>(e =>
        {
            e.ToTable("pet_place_reviews", "public", table =>
            {
                table.HasCheckConstraint("CK_pet_place_reviews_rating_range", "rating >= 1 AND rating <= 5");
            });
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.PlaceId).HasColumnName("place_id").IsRequired();
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.Rating).HasColumnName("rating").IsRequired();
            e.Property(x => x.Comment).HasColumnName("comment").HasMaxLength(2000);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasOne(x => x.Place)
                .WithMany(x => x.Reviews)
                .HasForeignKey(x => x.PlaceId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.User)
                .WithMany(x => x.PlaceReviews)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.PlaceId);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => new { x.PlaceId, x.UserId }).IsUnique();
        });

        b.Entity<ConsultationModel>(e =>
        {
            e.ToTable("consultations", "public");
            e.HasKey(x => x.Id);

            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.PetId).HasColumnName("pet_id");
            e.Property(x => x.VetPlaceId).HasColumnName("vet_place_id");
            e.Property(x => x.Date).HasColumnName("date").IsRequired();
            e.Property(x => x.Details).HasColumnName("details").HasMaxLength(3000).IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasOne(x => x.User).WithMany(u => u.Consultations).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Pet).WithMany(p => p.Consultations).HasForeignKey(x => x.PetId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.VetPlace).WithMany(v => v.Consultations).HasForeignKey(x => x.VetPlaceId).OnDelete(DeleteBehavior.SetNull);

            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.PetId);
            e.HasIndex(x => x.Date);
        });

        b.Entity<ForumPostModel>(e =>
        {
            e.ToTable("forum_posts", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Content).HasColumnName("content").HasMaxLength(5000).IsRequired();
            e.Property(x => x.IsAReply).HasColumnName("is_a_reply").IsRequired();
            e.Property(x => x.ReplyingToPostId).HasColumnName("replying_to_post");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasOne(x => x.User).WithMany(u => u.ForumPosts).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ReplyingToPost).WithMany(x => x.Replies).HasForeignKey(x => x.ReplyingToPostId).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.ReplyingToPostId);
            e.HasIndex(x => x.CreatedAt);
        });

        b.Entity<ForumPostAttachmentModel>(e =>
        {
            e.ToTable("forum_post_attachments", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ForumPostId).HasColumnName("forum_post_id");
            e.Property(x => x.Url).HasColumnName("url").HasMaxLength(1024).IsRequired();
            e.Property(x => x.MediaType).HasColumnName("media_type").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.FileSizeBytes).HasColumnName("file_size_bytes").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.ForumPost).WithMany(p => p.Attachments).HasForeignKey(x => x.ForumPostId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.ForumPostId);
            e.HasIndex(x => new { x.ForumPostId, x.CreatedAt });
        });

        b.Entity<ForumPostBookmarkModel>(e =>
        {
            e.ToTable("forum_post_bookmarks", "public");
            e.HasKey(x => new { x.UserId, x.ForumPostId });
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.ForumPostId).HasColumnName("forum_post_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.User).WithMany(u => u.BookmarkedPosts).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ForumPost).WithMany(p => p.Bookmarks).HasForeignKey(x => x.ForumPostId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ForumPostLikeModel>(e =>
        {
            e.ToTable("forum_post_likes", "public");
            e.HasKey(x => new { x.UserId, x.ForumPostId });
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.ForumPostId).HasColumnName("forum_post_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.User).WithMany(u => u.LikedPosts).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ForumPost).WithMany(p => p.Likes).HasForeignKey(x => x.ForumPostId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ReportModel>(e =>
        {
            e.ToTable("reports", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ReporterUserId).HasColumnName("reporter_user_id").IsRequired();
            e.Property(x => x.TargetType).HasColumnName("target_type").HasConversion<string>().HasMaxLength(30).IsRequired();
            e.Property(x => x.TargetId).HasColumnName("target_id").HasMaxLength(100).IsRequired();
            e.Property(x => x.ReasonType).HasColumnName("reason_type").HasConversion<string>().HasMaxLength(40).IsRequired();
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000);
            e.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.ReviewedByAdminId).HasColumnName("reviewed_by_admin_id");
            e.Property(x => x.ReviewedAt).HasColumnName("reviewed_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.ReporterUser)
                .WithMany(x => x.SubmittedReports)
                .HasForeignKey(x => x.ReporterUserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.ReviewedByAdmin)
                .WithMany(x => x.ReviewedReports)
                .HasForeignKey(x => x.ReviewedByAdminId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasIndex(x => x.ReporterUserId);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.TargetType);
            e.HasIndex(x => x.ReasonType);
            e.HasIndex(x => new { x.TargetType, x.TargetId });
            e.HasIndex(x => new { x.TargetType, x.TargetId, x.Status });
            e.HasIndex(x => new { x.ReporterUserId, x.TargetType, x.TargetId })
                .IsUnique()
                .HasFilter("\"status\" = 'Pending'");
        });

        b.Entity<PlaceOwnerApplicationModel>(e =>
        {
            e.ToTable("place_owner_applications", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.BusinessName).HasColumnName("business_name").HasMaxLength(200).IsRequired();
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000);
            e.Property(x => x.AddressLine1).HasColumnName("address_line1").HasMaxLength(200).IsRequired();
            e.Property(x => x.AddressLine2).HasColumnName("address_line2").HasMaxLength(200);
            e.Property(x => x.City).HasColumnName("city").HasMaxLength(100).IsRequired();
            e.Property(x => x.Country).HasColumnName("country").HasMaxLength(100).IsRequired();
            e.Property(x => x.RequestedPlaceType).HasColumnName("requested_place_type").HasConversion<string>().HasMaxLength(30).IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.RejectionReason).HasColumnName("rejection_reason").HasMaxLength(1000);
            e.Property(x => x.AdminNotes).HasColumnName("admin_notes").HasMaxLength(1000);
            e.Property(x => x.ReviewedByAdminId).HasColumnName("reviewed_by_admin_id");
            e.Property(x => x.ReviewedAt).HasColumnName("reviewed_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

            e.HasOne(x => x.User)
                .WithMany(x => x.PlaceOwnerApplications)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.ReviewedByAdmin)
                .WithMany(x => x.ReviewedPlaceOwnerApplications)
                .HasForeignKey(x => x.ReviewedByAdminId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.RequestedPlaceType);
            e.HasIndex(x => new { x.UserId, x.Status })
                .IsUnique()
                .HasFilter("\"status\" = 'Pending'");
        });

        b.Entity<PlaceOwnerApplicationImageModel>(e =>
        {
            e.ToTable("place_owner_application_images", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.PlaceOwnerApplicationId).HasColumnName("place_owner_application_id").IsRequired();
            e.Property(x => x.Url).HasColumnName("url").HasMaxLength(1024).IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.PlaceOwnerApplication)
                .WithMany(x => x.Images)
                .HasForeignKey(x => x.PlaceOwnerApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.PlaceOwnerApplicationId);
            e.HasIndex(x => new { x.PlaceOwnerApplicationId, x.CreatedAt });
        });

        b.Entity<VaccineRecordModel>(e =>
        {
            e.ToTable("vaccine_records", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.PetId).HasColumnName("pet_id");
            e.Property(x => x.VaccineName).HasColumnName("vaccine_name").HasMaxLength(200).IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.DateAdministered).HasColumnName("date_administered");
            e.Property(x => x.NextDueDate).HasColumnName("next_due_date");
            e.Property(x => x.Notes).HasColumnName("notes").HasMaxLength(2000);
            e.Property(x => x.Veterinarian).HasColumnName("veterinarian").HasMaxLength(200);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

            e.HasOne(x => x.Pet).WithMany(p => p.VaccineRecords).HasForeignKey(x => x.PetId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.PetId, x.Status });
            e.HasIndex(x => x.NextDueDate);
        });

        b.Entity<IllnessRecordModel>(e =>
        {
            e.ToTable("illness_records", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.PetId).HasColumnName("pet_id");
            e.Property(x => x.IllnessName).HasColumnName("illness_name").HasMaxLength(200).IsRequired();
            e.Property(x => x.DiagnosisDate).HasColumnName("diagnosis_date").IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000);
            e.Property(x => x.Notes).HasColumnName("notes").HasMaxLength(2000);
            e.Property(x => x.CuredDate).HasColumnName("cured_date");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

            e.HasOne(x => x.Pet).WithMany(p => p.IllnessRecords).HasForeignKey(x => x.PetId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.PetId, x.Status });
        });

        b.Entity<MedicationRecordModel>(e =>
        {
            e.ToTable("medication_records", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.IllnessId).HasColumnName("illness_id");
            e.Property(x => x.MedicationName).HasColumnName("medication_name").HasMaxLength(200).IsRequired();
            e.Property(x => x.Dosage).HasColumnName("dosage").HasMaxLength(200);
            e.Property(x => x.Instructions).HasColumnName("instructions").HasMaxLength(2000);
            e.Property(x => x.StartDate).HasColumnName("start_date").IsRequired();
            e.Property(x => x.EndDate).HasColumnName("end_date");
            e.Property(x => x.FrequencyInDays).HasColumnName("frequency_in_days").IsRequired();
            e.Property(x => x.Times).HasColumnName("times").HasColumnType("text[]");
            e.Property(x => x.ReminderEnabled).HasColumnName("reminder_enabled").IsRequired();
            e.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

            e.HasOne(x => x.Illness).WithMany(i => i.Medications).HasForeignKey(x => x.IllnessId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.IllnessId, x.IsActive });
            e.HasIndex(x => x.ReminderEnabled);
        });
    }
}
