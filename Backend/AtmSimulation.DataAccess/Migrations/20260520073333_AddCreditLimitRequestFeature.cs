using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AtmSimulation.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditLimitRequestFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ApprovedByAdminId",
                table: "Cards",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LimitApprovedDate",
                table: "Cards",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LimitRequestDate",
                table: "Cards",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LimitRequestReason",
                table: "Cards",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LimitRequestStatus",
                table: "Cards",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RequestedCreditLimit",
                table: "Cards",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedByAdminId",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "LimitApprovedDate",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "LimitRequestDate",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "LimitRequestReason",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "LimitRequestStatus",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "RequestedCreditLimit",
                table: "Cards");
        }
    }
}
