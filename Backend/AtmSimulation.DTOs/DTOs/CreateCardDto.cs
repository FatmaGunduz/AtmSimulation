using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Application.DTOs
{
    public class CreateCardDto
    {
        public int AccountId { get; set; }
        public string? CardNumber { get; set; }
        public string? Pin { get; set; }
        public DateTime ExxpiryDate { get; set; }
        public decimal CreditLimit { get; set; } = 15000.00m;
    }
}
