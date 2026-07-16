using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Entities
{
    public class Transaction
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
        public decimal BalanceBefore { get; set; }
        public decimal BalanceAfter { get; set; }
        public string? FailReason { get; set; }
        public int? RelatedTransactionId { get; set; }
        public Transaction? RelatedTransaction { get; set; }
        public TransactionStatus Status { get; set; }

        public int AtmId { get; set; }
        public Atm? Atm { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Account? Account { get; set; }
        public int? CardId { get; set; }
        public Card? Card { get; set; }

    }
}
