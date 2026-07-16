using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Application.DTOs
{
    public class CreateCustomerDto
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
    }
}
