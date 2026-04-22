using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaceOwnerApplicationFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_approved_place_owner",
                schema: "public",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<long>(
                name: "owner_user_id",
                schema: "public",
                table: "pet_places",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "place_owner_applications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    business_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    address_line1 = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    address_line2 = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    requested_place_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    rejection_reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    admin_notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    reviewed_by_admin_id = table.Column<long>(type: "bigint", nullable: true),
                    reviewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_place_owner_applications", x => x.id);
                    table.ForeignKey(
                        name: "FK_place_owner_applications_admin_users_reviewed_by_admin_id",
                        column: x => x.reviewed_by_admin_id,
                        principalSchema: "public",
                        principalTable: "admin_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_place_owner_applications_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_pet_places_owner_user_id",
                schema: "public",
                table: "pet_places",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_place_owner_applications_created_at",
                schema: "public",
                table: "place_owner_applications",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_place_owner_applications_requested_place_type",
                schema: "public",
                table: "place_owner_applications",
                column: "requested_place_type");

            migrationBuilder.CreateIndex(
                name: "IX_place_owner_applications_reviewed_by_admin_id",
                schema: "public",
                table: "place_owner_applications",
                column: "reviewed_by_admin_id");

            migrationBuilder.CreateIndex(
                name: "IX_place_owner_applications_status",
                schema: "public",
                table: "place_owner_applications",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_place_owner_applications_user_id",
                schema: "public",
                table: "place_owner_applications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_place_owner_applications_user_id_status",
                schema: "public",
                table: "place_owner_applications",
                columns: new[] { "user_id", "status" },
                unique: true,
                filter: "\"status\" = 'Pending'");

            migrationBuilder.AddForeignKey(
                name: "FK_pet_places_users_owner_user_id",
                schema: "public",
                table: "pet_places",
                column: "owner_user_id",
                principalSchema: "public",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_pet_places_users_owner_user_id",
                schema: "public",
                table: "pet_places");

            migrationBuilder.DropTable(
                name: "place_owner_applications",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "IX_pet_places_owner_user_id",
                schema: "public",
                table: "pet_places");

            migrationBuilder.DropColumn(
                name: "is_approved_place_owner",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "owner_user_id",
                schema: "public",
                table: "pet_places");
        }
    }
}
