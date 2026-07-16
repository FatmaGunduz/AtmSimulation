using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Entities
{
    public class Admin
    {
        public int Id { get; set; }
        public string? UserName { get; set; }
        public string? PasswordHash { get; set; }
        public string? FullName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
