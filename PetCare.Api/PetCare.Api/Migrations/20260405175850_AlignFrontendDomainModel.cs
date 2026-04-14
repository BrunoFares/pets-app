using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using PetCare.Api.Model;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AlignFrontendDomainModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:pet_sex", "male,female,unknown");

            migrationBuilder.CreateTable(
                name: "pet_places",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    photo = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    address_line1 = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    address_line2 = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    lat = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    lon = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pet_places", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "species",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_species", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_login = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "breeds",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    species_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_breeds", x => x.id);
                    table.ForeignKey(
                        name: "FK_breeds_species_species_id",
                        column: x => x.species_id,
                        principalSchema: "public",
                        principalTable: "species",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "chat_sessions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_chat_sessions_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "forum_posts",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    content = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    is_a_reply = table.Column<bool>(type: "boolean", nullable: false),
                    replying_to_post = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_forum_posts", x => x.id);
                    table.ForeignKey(
                        name: "FK_forum_posts_forum_posts_replying_to_post",
                        column: x => x.replying_to_post,
                        principalSchema: "public",
                        principalTable: "forum_posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_forum_posts_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pets",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    species_id = table.Column<int>(type: "integer", nullable: false),
                    breed_id = table.Column<int>(type: "integer", nullable: true),
                    sex = table.Column<PetSex>(type: "pet_sex", nullable: false),
                    birth_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    weight_kg = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    color = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    neutered = table.Column<bool>(type: "boolean", nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pets", x => x.id);
                    table.ForeignKey(
                        name: "FK_pets_breeds_breed_id",
                        column: x => x.breed_id,
                        principalSchema: "public",
                        principalTable: "breeds",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pets_species_species_id",
                        column: x => x.species_id,
                        principalSchema: "public",
                        principalTable: "species",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pets_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chat_messages",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    chat_session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    content = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_messages", x => x.id);
                    table.ForeignKey(
                        name: "FK_chat_messages_chat_sessions_chat_session_id",
                        column: x => x.chat_session_id,
                        principalSchema: "public",
                        principalTable: "chat_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "forum_post_attachments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    forum_post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    url = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_forum_post_attachments", x => x.id);
                    table.ForeignKey(
                        name: "FK_forum_post_attachments_forum_posts_forum_post_id",
                        column: x => x.forum_post_id,
                        principalSchema: "public",
                        principalTable: "forum_posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "forum_post_bookmarks",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    forum_post_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_forum_post_bookmarks", x => new { x.user_id, x.forum_post_id });
                    table.ForeignKey(
                        name: "FK_forum_post_bookmarks_forum_posts_forum_post_id",
                        column: x => x.forum_post_id,
                        principalSchema: "public",
                        principalTable: "forum_posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_forum_post_bookmarks_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "consultations",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    pet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vet_place_id = table.Column<Guid>(type: "uuid", nullable: true),
                    date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    details = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_consultations", x => x.id);
                    table.ForeignKey(
                        name: "FK_consultations_pet_places_vet_place_id",
                        column: x => x.vet_place_id,
                        principalSchema: "public",
                        principalTable: "pet_places",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_consultations_pets_pet_id",
                        column: x => x.pet_id,
                        principalSchema: "public",
                        principalTable: "pets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_consultations_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "illness_records",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    illness_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    diagnosis_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    cured_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_illness_records", x => x.id);
                    table.ForeignKey(
                        name: "FK_illness_records_pets_pet_id",
                        column: x => x.pet_id,
                        principalSchema: "public",
                        principalTable: "pets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vaccine_records",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vaccine_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    date_administered = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    next_due_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    veterinarian = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vaccine_records", x => x.id);
                    table.ForeignKey(
                        name: "FK_vaccine_records_pets_pet_id",
                        column: x => x.pet_id,
                        principalSchema: "public",
                        principalTable: "pets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medication_records",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    illness_id = table.Column<long>(type: "bigint", nullable: false),
                    medication_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    dosage = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    instructions = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    start_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    frequency_in_days = table.Column<int>(type: "integer", nullable: false),
                    times = table.Column<List<string>>(type: "text[]", nullable: false),
                    reminder_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medication_records", x => x.id);
                    table.ForeignKey(
                        name: "FK_medication_records_illness_records_illness_id",
                        column: x => x.illness_id,
                        principalSchema: "public",
                        principalTable: "illness_records",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_breeds_species_id_name",
                schema: "public",
                table: "breeds",
                columns: new[] { "species_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_chat_session_id_created_at",
                schema: "public",
                table: "chat_messages",
                columns: new[] { "chat_session_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_chat_sessions_user_id",
                schema: "public",
                table: "chat_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_consultations_date",
                schema: "public",
                table: "consultations",
                column: "date");

            migrationBuilder.CreateIndex(
                name: "IX_consultations_pet_id",
                schema: "public",
                table: "consultations",
                column: "pet_id");

            migrationBuilder.CreateIndex(
                name: "IX_consultations_user_id",
                schema: "public",
                table: "consultations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_consultations_vet_place_id",
                schema: "public",
                table: "consultations",
                column: "vet_place_id");

            migrationBuilder.CreateIndex(
                name: "IX_forum_post_attachments_forum_post_id",
                schema: "public",
                table: "forum_post_attachments",
                column: "forum_post_id");

            migrationBuilder.CreateIndex(
                name: "IX_forum_post_bookmarks_forum_post_id",
                schema: "public",
                table: "forum_post_bookmarks",
                column: "forum_post_id");

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_created_at",
                schema: "public",
                table: "forum_posts",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_replying_to_post",
                schema: "public",
                table: "forum_posts",
                column: "replying_to_post");

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_user_id",
                schema: "public",
                table: "forum_posts",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_illness_records_pet_id_status",
                schema: "public",
                table: "illness_records",
                columns: new[] { "pet_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_medication_records_illness_id_is_active",
                schema: "public",
                table: "medication_records",
                columns: new[] { "illness_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "IX_medication_records_reminder_enabled",
                schema: "public",
                table: "medication_records",
                column: "reminder_enabled");

            migrationBuilder.CreateIndex(
                name: "IX_pet_places_city_country",
                schema: "public",
                table: "pet_places",
                columns: new[] { "city", "country" });

            migrationBuilder.CreateIndex(
                name: "IX_pet_places_status",
                schema: "public",
                table: "pet_places",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_pet_places_type",
                schema: "public",
                table: "pet_places",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "IX_pets_breed_id",
                schema: "public",
                table: "pets",
                column: "breed_id");

            migrationBuilder.CreateIndex(
                name: "IX_pets_species_id",
                schema: "public",
                table: "pets",
                column: "species_id");

            migrationBuilder.CreateIndex(
                name: "IX_pets_user_id_name",
                schema: "public",
                table: "pets",
                columns: new[] { "user_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_species_code",
                schema: "public",
                table: "species",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_species_name",
                schema: "public",
                table: "species",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                schema: "public",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_username",
                schema: "public",
                table: "users",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vaccine_records_next_due_date",
                schema: "public",
                table: "vaccine_records",
                column: "next_due_date");

            migrationBuilder.CreateIndex(
                name: "IX_vaccine_records_pet_id_status",
                schema: "public",
                table: "vaccine_records",
                columns: new[] { "pet_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chat_messages",
                schema: "public");

            migrationBuilder.DropTable(
                name: "consultations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "forum_post_attachments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "forum_post_bookmarks",
                schema: "public");

            migrationBuilder.DropTable(
                name: "medication_records",
                schema: "public");

            migrationBuilder.DropTable(
                name: "vaccine_records",
                schema: "public");

            migrationBuilder.DropTable(
                name: "chat_sessions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "pet_places",
                schema: "public");

            migrationBuilder.DropTable(
                name: "forum_posts",
                schema: "public");

            migrationBuilder.DropTable(
                name: "illness_records",
                schema: "public");

            migrationBuilder.DropTable(
                name: "pets",
                schema: "public");

            migrationBuilder.DropTable(
                name: "breeds",
                schema: "public");

            migrationBuilder.DropTable(
                name: "users",
                schema: "public");

            migrationBuilder.DropTable(
                name: "species",
                schema: "public");
        }
    }
}
