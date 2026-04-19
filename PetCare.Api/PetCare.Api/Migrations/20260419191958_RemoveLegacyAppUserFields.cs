using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyAppUserFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "name",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "phone_number",
                schema: "public",
                table: "users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "name",
                schema: "public",
                table: "users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "phone_number",
                schema: "public",
                table: "users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }
    }
}
