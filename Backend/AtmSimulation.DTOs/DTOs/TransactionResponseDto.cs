using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Application.DTOs
{
    public class TransactionResponseDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string? Type { get; set; }
        public decimal BalanceBefore { get; set; }
        public decimal BalanceAfter { get; set; }
        public string? Status { get; set; }
        public string? FailReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? AccountNumber { get; set; }
        public string? OwnerName { get; set; }
    }
}
