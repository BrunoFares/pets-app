using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserChatCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "chat_code",
                schema: "public",
                table: "users",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.Sql(@"
DO $$
DECLARE
    user_record record;
    candidate text;
BEGIN
    FOR user_record IN SELECT id FROM public.users WHERE chat_code IS NULL ORDER BY id LOOP
        LOOP
            SELECT string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', floor(random() * 32)::int + 1, 1), '')
            INTO candidate
            FROM generate_series(1, 8);

            EXIT WHEN NOT EXISTS (
                SELECT 1
                FROM public.users
                WHERE chat_code = candidate
                  AND id <> user_record.id
            );
        END LOOP;

        UPDATE public.users
        SET chat_code = candidate
        WHERE id = user_record.id;
    END LOOP;
END $$;
");

            migrationBuilder.AlterColumn<string>(
                name: "chat_code",
                schema: "public",
                table: "users",
                type: "character varying(8)",
                maxLength: 8,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(8)",
                oldMaxLength: 8,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_chat_code",
                schema: "public",
                table: "users",
                column: "chat_code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_chat_code",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "chat_code",
                schema: "public",
                table: "users");
        }
    }
}
