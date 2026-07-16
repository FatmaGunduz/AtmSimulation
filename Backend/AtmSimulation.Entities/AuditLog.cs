using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string? TableName { get; set; }
        public string? Action { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string? IpAddress { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
