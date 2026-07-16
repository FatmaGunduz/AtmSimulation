using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace AtmSimulation.Entities
{
    public class Account
    {
        public int Id { get; set; }
        public string? AccountNumber { get; set; }
        public string? OwnerName { get; set; }
        public decimal Balance { get; set; }
        public DateTime CreatedAt { get; set; }
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public List<Card> Cards { get; set; } = new();
        
        public List<Transaction> Transactions { get; set; } = new();
        
        // Concurrency token for optimistic concurrency control
        [Timestamp]
        public byte[]? RowVersion { get; set; }

    }
}
