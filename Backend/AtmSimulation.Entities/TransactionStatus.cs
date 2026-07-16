using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Entities
{
    public enum TransactionStatus
    {
        Pending,
        Success,
        Failed,
        Dispensed,
        Reversed,
        ReversalPending

     
    }
}
