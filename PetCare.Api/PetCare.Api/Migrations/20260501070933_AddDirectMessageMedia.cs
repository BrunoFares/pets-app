using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDirectMessageMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_direct_messages_content_not_blank",
                schema: "public",
                table: "direct_messages");

            migrationBuilder.AddColumn<long>(
                name: "media_size_bytes",
                schema: "public",
                table: "direct_messages",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "media_type",
                schema: "public",
                table: "direct_messages",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "media_url",
                schema: "public",
                table: "direct_messages",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_direct_messages_content_or_media",
                schema: "public",
                table: "direct_messages",
                sql: "length(btrim(content)) > 0 OR media_url IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_direct_messages_media_metadata_complete",
                schema: "public",
                table: "direct_messages",
                sql: "(media_url IS NULL AND media_type IS NULL AND media_size_bytes IS NULL) OR (media_url IS NOT NULL AND media_type IS NOT NULL AND media_size_bytes IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_direct_messages_media_size_positive",
                schema: "public",
                table: "direct_messages",
                sql: "media_size_bytes IS NULL OR media_size_bytes > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_direct_messages_content_or_media",
                schema: "public",
                table: "direct_messages");

            migrationBuilder.DropCheckConstraint(
                name: "CK_direct_messages_media_metadata_complete",
                schema: "public",
                table: "direct_messages");

            migrationBuilder.DropCheckConstraint(
                name: "CK_direct_messages_media_size_positive",
                schema: "public",
                table: "direct_messages");

            migrationBuilder.Sql(@"
UPDATE public.direct_messages
SET content = '[media]'
WHERE length(btrim(content)) = 0
  AND media_url IS NOT NULL;
");

            migrationBuilder.DropColumn(
                name: "media_size_bytes",
                schema: "public",
                table: "direct_messages");

            migrationBuilder.DropColumn(
                name: "media_type",
                schema: "public",
                table: "direct_messages");

            migrationBuilder.DropColumn(
                name: "media_url",
                schema: "public",
                table: "direct_messages");

            migrationBuilder.AddCheckConstraint(
                name: "CK_direct_messages_content_not_blank",
                schema: "public",
                table: "direct_messages",
                sql: "length(btrim(content)) > 0");
        }
    }
}
