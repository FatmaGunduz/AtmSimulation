using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Entities
{
    public class Atm
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public decimal CurrentCash { get; set; }
        public AtmStatus Status { get; set; }
        public string? Location { get; set; }
        public DateTime? LastServiceDate { get; set; }

        // Banknot Sayıları
        public int Count200 { get; set; }
        public int Count100 { get; set; }
        public int Count50 { get; set; }
        public int Count20 { get; set; }
        public int Count10 { get; set; }

        public string? Issues { get; set; }

        public List<Transaction> Transactions { get; set; } = new();
    }
}
