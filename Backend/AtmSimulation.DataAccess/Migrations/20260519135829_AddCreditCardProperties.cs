using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AtmSimulation.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditCardProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CreditDebt",
                table: "Cards",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CreditLimit",
                table: "Cards",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreditDebt",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "CreditLimit",
                table: "Cards");
        }
    }
}
