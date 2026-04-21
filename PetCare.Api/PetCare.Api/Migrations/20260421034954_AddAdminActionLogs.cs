using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminActionLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "admin_action_logs",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    admin_user_id = table.Column<long>(type: "bigint", nullable: false),
                    action_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    target_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    target_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_action_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_admin_action_logs_admin_users_admin_user_id",
                        column: x => x.admin_user_id,
                        principalSchema: "public",
                        principalTable: "admin_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_admin_action_logs_action_type",
                schema: "public",
                table: "admin_action_logs",
                column: "action_type");

            migrationBuilder.CreateIndex(
                name: "IX_admin_action_logs_admin_user_id",
                schema: "public",
                table: "admin_action_logs",
                column: "admin_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_admin_action_logs_admin_user_id_created_at",
                schema: "public",
                table: "admin_action_logs",
                columns: new[] { "admin_user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_admin_action_logs_created_at",
                schema: "public",
                table: "admin_action_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_admin_action_logs_target_id",
                schema: "public",
                table: "admin_action_logs",
                column: "target_id");

            migrationBuilder.CreateIndex(
                name: "IX_admin_action_logs_target_type",
                schema: "public",
                table: "admin_action_logs",
                column: "target_type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_action_logs",
                schema: "public");
        }
    }
}
