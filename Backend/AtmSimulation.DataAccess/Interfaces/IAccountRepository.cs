using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.DataAccess.Interfaces
{
    public interface IAccountRepository
    {
        Task<Account?> GetByIdAsync(int id);
        Task UpdateAsync(Account account);
        // Execute withdrawal and deposit operations atomically when needed
        Task ExecuteWithdrawalAsync(Account account, Transaction transaction);
        Task ExecuteDepositAsync(Account account, Transaction transaction);

        // Confirmation / reconciliation operations for pending transactions
        Task ProcessDispenseConfirmationAsync(int transactionId, bool cashDispensed, string? reason = null);
        Task ProcessDepositConfirmationAsync(int transactionId, bool cashReceived, string? reason = null);
        Task<decimal> GetDailyWithdrawalTotalAsync(int accountId);
        Task<List<Account>> GetAllAsync();
        Task AddAsync(Account account);
        Task DeleteAsync(int id);
        Task<List<Account>> GetByCustomerIdAsync(int customerId);
    }
}
