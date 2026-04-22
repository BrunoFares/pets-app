using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPetPlaceReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pet_place_reviews",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    place_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pet_place_reviews", x => x.id);
                    table.CheckConstraint("CK_pet_place_reviews_rating_range", "rating >= 1 AND rating <= 5");
                    table.ForeignKey(
                        name: "FK_pet_place_reviews_pet_places_place_id",
                        column: x => x.place_id,
                        principalSchema: "public",
                        principalTable: "pet_places",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_pet_place_reviews_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_pet_place_reviews_created_at",
                schema: "public",
                table: "pet_place_reviews",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_pet_place_reviews_place_id",
                schema: "public",
                table: "pet_place_reviews",
                column: "place_id");

            migrationBuilder.CreateIndex(
                name: "IX_pet_place_reviews_place_id_user_id",
                schema: "public",
                table: "pet_place_reviews",
                columns: new[] { "place_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pet_place_reviews_user_id",
                schema: "public",
                table: "pet_place_reviews",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pet_place_reviews",
                schema: "public");
        }
    }
}
