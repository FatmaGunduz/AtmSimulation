using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AtmSimulation.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class SetDefaultCreditLimitForExistingCards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Mevcut kartlara kredi limitini 15000 TL olarak set et
            migrationBuilder.Sql(@"
                UPDATE Cards 
                SET CreditLimit = 15000.00,
                    CreditDebt = 0,
                    LimitRequestStatus = NULL,
                    RequestedCreditLimit = NULL
                WHERE CreditLimit IS NULL OR CreditLimit = 0
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Geri alma
        }
    }
}
