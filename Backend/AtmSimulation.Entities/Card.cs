using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations.Schema;

namespace AtmSimulation.Entities
{
    public enum LimitRequestStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }

    public class Card
    {
        public int Id { get; set; }
        public string? CardNumber { get; set; }
        public string? PinHash { get; set; }
        public bool IsBlocked { get; set; }
        public int FailedPinAttempts { get; set; }
        public DateTime ExpiryDate { get; set; }

        public int AccountId { get; set; }
        public Account? Account { get; set; }

        // Hybrid Card properties (simulated without database migration)
        [NotMapped]
        public bool IsCreditCard => true;

        public decimal CreditLimit { get; set; } = 15000.00m;

        public decimal CreditDebt { get; set; } = 2400.00m;

        // Limit Increase Request Properties
        public decimal? RequestedCreditLimit { get; set; }
        public LimitRequestStatus? LimitRequestStatus { get; set; }
        public DateTime? LimitRequestDate { get; set; }
        public string? LimitRequestReason { get; set; }
        public string? LimitRejectionReason { get; set; }
        public int? ApprovedByAdminId { get; set; }
        public DateTime? LimitApprovedDate { get; set; }
    }
}

