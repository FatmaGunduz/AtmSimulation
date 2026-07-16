using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Application.DTOs
{
    public class DepositRequestDto
    {
        public int AccountId { get; set; }
        public int AtmId { get; set; }
        [System.ComponentModel.DataAnnotations.Range(1, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }
    }
}
