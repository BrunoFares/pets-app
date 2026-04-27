using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddForumFinalModerationLabel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "final_moderation_label",
                schema: "public",
                table: "forum_posts",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_final_moderation_label",
                schema: "public",
                table: "forum_posts",
                column: "final_moderation_label");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_forum_posts_final_moderation_label",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "final_moderation_label",
                schema: "public",
                table: "forum_posts");
        }
    }
}
