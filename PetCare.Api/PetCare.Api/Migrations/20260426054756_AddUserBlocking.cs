using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserBlocking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_blocks",
                schema: "public",
                columns: table => new
                {
                    blocker_user_id = table.Column<long>(type: "bigint", nullable: false),
                    blocked_user_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_blocks", x => new { x.blocker_user_id, x.blocked_user_id });
                    table.ForeignKey(
                        name: "FK_user_blocks_users_blocked_user_id",
                        column: x => x.blocked_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_blocks_users_blocker_user_id",
                        column: x => x.blocker_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_blocks_blocked_user_id",
                schema: "public",
                table: "user_blocks",
                column: "blocked_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_blocks_created_at",
                schema: "public",
                table: "user_blocks",
                column: "created_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_blocks",
                schema: "public");
        }
    }
}
