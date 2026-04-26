using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddForumPostMediaAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "file_size_bytes",
                schema: "public",
                table: "forum_post_attachments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "media_type",
                schema: "public",
                table: "forum_post_attachments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Image");

            migrationBuilder.Sql("""
                UPDATE public.forum_post_attachments
                SET media_type = CASE
                    WHEN lower(split_part(url, '?', 1)) LIKE '%.mp4' THEN 'Video'
                    WHEN lower(split_part(url, '?', 1)) LIKE '%.webm' THEN 'Video'
                    ELSE 'Image'
                END;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_forum_post_attachments_forum_post_id_created_at",
                schema: "public",
                table: "forum_post_attachments",
                columns: new[] { "forum_post_id", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_forum_post_attachments_forum_post_id_created_at",
                schema: "public",
                table: "forum_post_attachments");

            migrationBuilder.DropColumn(
                name: "file_size_bytes",
                schema: "public",
                table: "forum_post_attachments");

            migrationBuilder.DropColumn(
                name: "media_type",
                schema: "public",
                table: "forum_post_attachments");
        }
    }
}
