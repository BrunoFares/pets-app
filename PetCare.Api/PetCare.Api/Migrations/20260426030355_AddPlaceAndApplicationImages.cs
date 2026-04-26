using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaceAndApplicationImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pet_place_images",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pet_place_id = table.Column<Guid>(type: "uuid", nullable: false),
                    url = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pet_place_images", x => x.id);
                    table.ForeignKey(
                        name: "FK_pet_place_images_pet_places_pet_place_id",
                        column: x => x.pet_place_id,
                        principalSchema: "public",
                        principalTable: "pet_places",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "place_owner_application_images",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    place_owner_application_id = table.Column<long>(type: "bigint", nullable: false),
                    url = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_place_owner_application_images", x => x.id);
                    table.ForeignKey(
                        name: "FK_place_owner_application_images_place_owner_applications_pla~",
                        column: x => x.place_owner_application_id,
                        principalSchema: "public",
                        principalTable: "place_owner_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_pet_place_images_pet_place_id",
                schema: "public",
                table: "pet_place_images",
                column: "pet_place_id");

            migrationBuilder.CreateIndex(
                name: "IX_pet_place_images_pet_place_id_created_at",
                schema: "public",
                table: "pet_place_images",
                columns: new[] { "pet_place_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_place_owner_application_images_place_owner_application_id",
                schema: "public",
                table: "place_owner_application_images",
                column: "place_owner_application_id");

            migrationBuilder.CreateIndex(
                name: "IX_place_owner_application_images_place_owner_application_id_c~",
                schema: "public",
                table: "place_owner_application_images",
                columns: new[] { "place_owner_application_id", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pet_place_images",
                schema: "public");

            migrationBuilder.DropTable(
                name: "place_owner_application_images",
                schema: "public");
        }
    }
}
