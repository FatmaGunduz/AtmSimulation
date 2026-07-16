using AtmSimulation.DataAccess.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AtmSimulation.DataAccess.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(BankDbContext))]
    [Migration("20260520103000_AddLimitRejectionReason")]
    public partial class AddLimitRejectionReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LimitRejectionReason",
                table: "Cards",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LimitRejectionReason",
                table: "Cards");
        }
    }
}
