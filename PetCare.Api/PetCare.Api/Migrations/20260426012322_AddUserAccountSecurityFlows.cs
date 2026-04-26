using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAccountSecurityFlows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "email_change_code_expires_at",
                schema: "public",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "email_change_code_hash",
                schema: "public",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "password_reset_code_expires_at",
                schema: "public",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "password_reset_code_hash",
                schema: "public",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "pending_new_email",
                schema: "public",
                table: "users",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "email_change_code_expires_at",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "email_change_code_hash",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_code_expires_at",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_code_hash",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "pending_new_email",
                schema: "public",
                table: "users");
        }
    }
}
