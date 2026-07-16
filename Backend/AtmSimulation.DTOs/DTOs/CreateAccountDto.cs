using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Application.DTOs
{
    public class CreateAccountDto
    {
        public string? OwnerName { get; set; }
        public decimal InitialBalance { get; set; }
    }
}
