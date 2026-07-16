using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Results
{
    public class PinResult
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int RemainingAttempts { get; set; }
        public bool IsBlocked { get; set; }
        public string? Token { get; set; }
        public int CardId { get; set; }
        public string? CustomerName { get; set; }
    }
}
