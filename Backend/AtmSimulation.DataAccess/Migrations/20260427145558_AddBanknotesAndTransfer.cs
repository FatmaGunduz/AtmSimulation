using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AtmSimulation.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddBanknotesAndTransfer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Count10",
                table: "Atms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Count100",
                table: "Atms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Count20",
                table: "Atms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Count200",
                table: "Atms",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Count50",
                table: "Atms",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Count10",
                table: "Atms");

            migrationBuilder.DropColumn(
                name: "Count100",
                table: "Atms");

            migrationBuilder.DropColumn(
                name: "Count20",
                table: "Atms");

            migrationBuilder.DropColumn(
                name: "Count200",
                table: "Atms");

            migrationBuilder.DropColumn(
                name: "Count50",
                table: "Atms");
        }
    }
}
