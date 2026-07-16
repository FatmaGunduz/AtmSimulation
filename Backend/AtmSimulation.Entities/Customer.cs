using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Entities
{
    public class Customer
    {
        public int Id { get; set; }
        public string? FullName { get; set; }
        public string? PasswordHash { get; set; }
        public string? Email { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<Account> Accounts { get; set; } = new();
    }
}
