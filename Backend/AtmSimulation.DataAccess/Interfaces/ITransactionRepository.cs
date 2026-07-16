using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;


namespace AtmSimulation.DataAccess.Interfaces
{
    public interface ITransactionRepository
    {
        Task AddAsync(Transaction transaction);
        Task UpdateAsync(Transaction transaction);
        Task<Transaction?> GetByIdAsync(int id);
        Task<List<Transaction>> GetLastTenAsync(int accountId);
        Task<List<Transaction>> GetAllAsync();
        Task<List<AuditLog>> GetAllAuditLogsAsync();
    }
}
