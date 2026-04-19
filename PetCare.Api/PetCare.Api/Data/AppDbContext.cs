using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using PetCare.Api.Model;

namespace PetCare.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<SpeciesModel> Species => Set<SpeciesModel>();
    public DbSet<BreedModel> Breeds => Set<BreedModel>();
    public DbSet<PetModel> Pets => Set<PetModel>();
    public DbSet<ConsultationModel> Consultations => Set<ConsultationModel>();
    public DbSet<ForumPostModel> ForumPosts => Set<ForumPostModel>();
    public DbSet<ForumPostAttachmentModel> ForumPostAttachments => Set<ForumPostAttachmentModel>();
    public DbSet<ForumPostBookmarkModel> ForumPostBookmarks => Set<ForumPostBookmarkModel>();
    public DbSet<ForumPostLikeModel> ForumPostLikes => Set<ForumPostLikeModel>();
    public DbSet<ChatSessionModel> ChatSessions => Set<ChatSessionModel>();
    public DbSet<ChatMessageModel> ChatMessages => Set<ChatMessageModel>();
    public DbSet<PetPlaceModel> PetPlaces => Set<PetPlaceModel>();
    public DbSet<PetPlaceScheduleModel> PetPlaceSchedules => Set<PetPlaceScheduleModel>();
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
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(1024);
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(1000);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.LastLogin).HasColumnName("last_login");

            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Username).IsUnique();
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

            e.HasIndex(x => x.Type);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => new { x.City, x.Country });
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
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.ForumPost).WithMany(p => p.Attachments).HasForeignKey(x => x.ForumPostId).OnDelete(DeleteBehavior.Cascade);
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

        b.Entity<ChatSessionModel>(e =>
        {
            e.ToTable("chat_sessions", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasOne(x => x.User).WithMany(u => u.Chats).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.UserId);
        });

        b.Entity<ChatMessageModel>(e =>
        {
            e.ToTable("chat_messages", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ChatSessionId).HasColumnName("chat_session_id");
            e.Property(x => x.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(10).IsRequired();
            e.Property(x => x.Content).HasColumnName("content").HasMaxLength(5000).IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            e.HasOne(x => x.ChatSession).WithMany(c => c.Messages).HasForeignKey(x => x.ChatSessionId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.ChatSessionId, x.CreatedAt });
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
