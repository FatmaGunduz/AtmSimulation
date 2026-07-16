using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AtmSimulation.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddAtmIssues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Issues",
                table: "Atms",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Issues",
                table: "Atms");
        }
    }
}
