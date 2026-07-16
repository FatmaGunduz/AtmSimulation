using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Results
{
    public class DepositResult
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public decimal Amount { get; set; }
        public decimal BalanceBefore { get; set; }
        public decimal BalanceAfter { get; set; }
    }
}
