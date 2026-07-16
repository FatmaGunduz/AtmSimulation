using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Interfaces
{
    public interface ITransactionService
    {
            Task ExecuteDepositAsync(int accountId, decimal amount);
            Task ExecuteWithdrawAsync(int accountId, decimal amount);
            Task ProcessWithdrawalConfirmationAsync(int transactionId, bool cashDispensed, string? reason = null);
            Task ProcessDepositConfirmationAsync(int transactionId, bool cashReceived, string ? reason = null);

    }
}
