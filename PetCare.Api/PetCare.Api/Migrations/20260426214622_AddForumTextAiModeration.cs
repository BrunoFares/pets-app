using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddForumTextAiModeration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "admin_moderation_notes",
                schema: "public",
                table: "forum_posts",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ai_moderation_confidence",
                schema: "public",
                table: "forum_posts",
                type: "numeric(5,4)",
                precision: 5,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ai_moderation_label",
                schema: "public",
                table: "forum_posts",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ai_moderation_reason",
                schema: "public",
                table: "forum_posts",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "moderated_at",
                schema: "public",
                table: "forum_posts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "moderation_status",
                schema: "public",
                table: "forum_posts",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "reviewed_at",
                schema: "public",
                table: "forum_posts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "reviewed_by_admin_id",
                schema: "public",
                table: "forum_posts",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_ai_moderation_label",
                schema: "public",
                table: "forum_posts",
                column: "ai_moderation_label");

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_moderated_at",
                schema: "public",
                table: "forum_posts",
                column: "moderated_at");

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_moderation_status",
                schema: "public",
                table: "forum_posts",
                column: "moderation_status");

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_moderation_status_created_at",
                schema: "public",
                table: "forum_posts",
                columns: new[] { "moderation_status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_forum_posts_reviewed_by_admin_id",
                schema: "public",
                table: "forum_posts",
                column: "reviewed_by_admin_id");

            migrationBuilder.AddForeignKey(
                name: "FK_forum_posts_admin_users_reviewed_by_admin_id",
                schema: "public",
                table: "forum_posts",
                column: "reviewed_by_admin_id",
                principalSchema: "public",
                principalTable: "admin_users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_forum_posts_admin_users_reviewed_by_admin_id",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropIndex(
                name: "IX_forum_posts_ai_moderation_label",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropIndex(
                name: "IX_forum_posts_moderated_at",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropIndex(
                name: "IX_forum_posts_moderation_status",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropIndex(
                name: "IX_forum_posts_moderation_status_created_at",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropIndex(
                name: "IX_forum_posts_reviewed_by_admin_id",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "admin_moderation_notes",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "ai_moderation_confidence",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "ai_moderation_label",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "ai_moderation_reason",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "moderated_at",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "moderation_status",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "reviewed_at",
                schema: "public",
                table: "forum_posts");

            migrationBuilder.DropColumn(
                name: "reviewed_by_admin_id",
                schema: "public",
                table: "forum_posts");
        }
    }
}
