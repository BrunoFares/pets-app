using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL; // HasPostgresEnum (optional)
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


    protected override void OnModelCreating(ModelBuilder b)
    {
        // Optional (helps EF understand the enum in the model; MapEnum is already in Program.cs)
        b.HasPostgresEnum<PetSex>("pet_sex");

        // ----- USERS -----
        b.Entity<AppUser>(e =>
        {
            e.ToTable("users", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Username).HasColumnName("username").IsRequired();
            e.Property(x => x.Email).HasColumnName("email").IsRequired();
            e.Property(x => x.PhoneNumber).HasColumnName("phone_number").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.LastLogin).HasColumnName("last_login");
            e.Property(x => x.FirstName).HasColumnName("first_name").IsRequired();
            e.Property(x => x.LastName).HasColumnName("last_name").IsRequired();
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url");

            e.HasIndex(x => x.Email).IsUnique();
        });

        // ----- SPECIES -----
        b.Entity<SpeciesModel>(e =>
        {
            e.ToTable("species", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Code).HasColumnName("code").IsRequired();
            e.Property(x => x.Name).HasColumnName("name").IsRequired();

            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => x.Name).IsUnique();
        });

        // ----- BREEDS -----
        b.Entity<BreedModel>(e =>
        {
            e.ToTable("breeds", "public");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.SpeciesId).HasColumnName("species_id");
            e.Property(x => x.Name).HasColumnName("name").IsRequired();

            e.HasOne(x => x.Species)
             .WithMany(s => s.Breeds)
             .HasForeignKey(x => x.SpeciesId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.SpeciesId, x.Name }).IsUnique(); // UNIQUE (species_id, name)
        });

        // ----- PETS -----
        b.Entity<PetModel>(e =>
        {
            e.ToTable("pet", "public");
            e.HasKey(x => x.Id);

            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            e.Property(x => x.SpeciesId).HasColumnName("species_id");
            e.Property(x => x.BreedId).HasColumnName("breed_id");

            // Map to PostgreSQL enum column
            e.Property(x => x.Sex)
             .HasColumnName("sex")
             .HasColumnType("pet_sex");

            e.Property(x => x.BirthDate).HasColumnName("birth_date");
            e.Property(x => x.ApproxAgeMonths).HasColumnName("approx_age_months");
            e.Property(x => x.WeightKg).HasColumnName("weight_kg").HasPrecision(5, 2);
            e.Property(x => x.Color).HasColumnName("color");
            e.Property(x => x.Neutered).HasColumnName("neutered");
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url");
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasIndex(x => new { x.UserId, x.Name }).IsUnique(); // optional duplicate-name guard

            e.HasOne(x => x.Species).WithMany().HasForeignKey(x => x.SpeciesId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Breed).WithMany().HasForeignKey(x => x.BreedId).OnDelete(DeleteBehavior.Restrict);
        });

        // ----- CONSULTATION -----
        b.Entity<ConsultationModel>(e =>
        {
            e.ToTable("consultations", "public");
            e.HasKey(x => x.Id);

            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.PetId).HasColumnName("pet_id");
            e.Property(x => x.VetId).HasColumnName("vet_id").IsRequired();
            e.Property(x => x.Date).HasColumnName("date").IsRequired();
            e.Property(x => x.Details).HasColumnName("details").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasOne(x => x.Pet)
             .WithMany()
             .HasForeignKey(x => x.PetId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.PetId);
        });
    }
}
