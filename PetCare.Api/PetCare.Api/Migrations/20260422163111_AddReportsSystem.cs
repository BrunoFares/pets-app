using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReportsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "reports",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    reporter_user_id = table.Column<long>(type: "bigint", nullable: false),
                    target_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    target_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    reason_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    reviewed_by_admin_id = table.Column<long>(type: "bigint", nullable: true),
                    reviewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reports", x => x.id);
                    table.ForeignKey(
                        name: "FK_reports_admin_users_reviewed_by_admin_id",
                        column: x => x.reviewed_by_admin_id,
                        principalSchema: "public",
                        principalTable: "admin_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_reports_users_reporter_user_id",
                        column: x => x.reporter_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_reports_created_at",
                schema: "public",
                table: "reports",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_reports_reason_type",
                schema: "public",
                table: "reports",
                column: "reason_type");

            migrationBuilder.CreateIndex(
                name: "IX_reports_reporter_user_id",
                schema: "public",
                table: "reports",
                column: "reporter_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_reports_reporter_user_id_target_type_target_id",
                schema: "public",
                table: "reports",
                columns: new[] { "reporter_user_id", "target_type", "target_id" },
                unique: true,
                filter: "\"status\" = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "IX_reports_reviewed_by_admin_id",
                schema: "public",
                table: "reports",
                column: "reviewed_by_admin_id");

            migrationBuilder.CreateIndex(
                name: "IX_reports_status",
                schema: "public",
                table: "reports",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_reports_target_type",
                schema: "public",
                table: "reports",
                column: "target_type");

            migrationBuilder.CreateIndex(
                name: "IX_reports_target_type_target_id",
                schema: "public",
                table: "reports",
                columns: new[] { "target_type", "target_id" });

            migrationBuilder.CreateIndex(
                name: "IX_reports_target_type_target_id_status",
                schema: "public",
                table: "reports",
                columns: new[] { "target_type", "target_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reports",
                schema: "public");
        }
    }
}
