using AtmSimulation.DataAccess.Context;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;

namespace AtmSimulation.DataAccess.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly BankDbContext _context;
        public AccountRepository(BankDbContext context)
        {
            _context = context; 
        }

        public async Task AddAsync(Account account)
        {
            await _context.Accounts.AddAsync(account);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account != null)
            {
                _context.Accounts.Remove(account);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ExecuteDepositAsync(Account account, Transaction transaction)
        {
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            {
                try
                {
                    transaction.Type = TransactionType.Deposit;
                    transaction.Status = TransactionStatus.Pending;
                    transaction.CreatedAt = DateTime.UtcNow;
                    
                    
                    _context.Transactions.Add(transaction);

                    await _context.SaveChangesAsync();
                    await dbTransaction.CommitAsync();
                }
                catch
                {
                    await dbTransaction.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task ExecuteWithdrawalAsync(Account account, Transaction transaction)
        {
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            {
                try
                {
                    if (account.Balance < transaction.Amount)
                        throw new Exception("Yetersiz bakiye");

                    transaction.Type = TransactionType.Withdraw;
                    transaction.Status = TransactionStatus.Pending;
                    transaction.CreatedAt = DateTime.UtcNow;

                    _context.Transactions.Add(transaction);

                    await _context.SaveChangesAsync();

                    await dbTransaction.CommitAsync();
                }
                catch
                {
                    await dbTransaction.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task<List<Account>> GetAllAsync()
        {
            return await _context.Accounts
                .Include(a => a.Customer)
                .Include(a => a.Cards)
                .ToListAsync();
        }

        public async Task<Account?> GetByIdAsync(int id)
        {
            return await _context.Accounts
                .Include(a => a.Customer)
                .Include(a => a.Cards)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<Account>> GetByCustomerIdAsync(int customerId)
        {
            return await _context.Accounts
                .Where(a => a.CustomerId == customerId)
                .Include(a => a.Cards)
                .ToListAsync();
        }

        public async Task<decimal> GetDailyWithdrawalTotalAsync(int accountId)
        {
            return await _context.Transactions
                .Where(t => t.AccountId == accountId &&
                            t.Type == TransactionType.Withdraw &&
                            t.Status == TransactionStatus.Success &&
                            t.CreatedAt >= DateTime.Today)
                .SumAsync(t => (decimal?)t.Amount) ?? 0;

        }

        public async Task ProcessDepositConfirmationAsync(int transactionId, bool cashReceived , string? reason = null)
        {
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var transaction = await _context.Transactions
                    .Include(t => t.Account)
                    .FirstOrDefaultAsync(t => t.Id == transactionId);
                if (transaction == null)
                    throw new Exception("İşlem bulunamadı");
                if (transaction.Status == TransactionStatus.Success)
                    throw new Exception("İşlem zaten tamamlanmış");
                var account = transaction.Account
                    ?? throw new Exception("İşleme ait hesap bulunamadı.");

                transaction.Status = cashReceived ? TransactionStatus.Success : TransactionStatus.Failed;
                transaction.FailReason = cashReceived ? null : reason;
                transaction.CompletedAt = DateTime.UtcNow;

                if (cashReceived)
                {
                    account.Balance += transaction.Amount;
                    transaction.BalanceAfter = account.Balance;
                }
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    // Concurrency conflict while applying deposit confirmation
                    throw new InvalidOperationException("Concurrency conflict while confirming deposit. Please retry.");
                }
                await dbTransaction.CommitAsync();
            }
            catch
            {
                await dbTransaction.RollbackAsync();
                throw;
            }
          

        }

        public async Task ProcessDispenseConfirmationAsync(int transactionId, bool cashDispensed, string? reason = null)
        {
            using var dbTransaction = _context.Database.BeginTransaction();
            try
            {
                var transaction = await _context.Transactions
                    .Include(t => t.Account)
                    .FirstOrDefaultAsync(t => t.Id == transactionId);
                if (transaction == null)
                    throw new Exception("İşlem bulunamadı.");
                if (transaction.Status == TransactionStatus.Success)
                    throw new Exception("İşlem zaten tamamlanmış.");

                var account = transaction.Account
                    ?? throw new Exception("İşleme ait hesap bulunamadı.");
                transaction.Status = cashDispensed ? TransactionStatus.Success : TransactionStatus.Failed;
                transaction.FailReason = cashDispensed ? null : reason;
                transaction.CompletedAt = DateTime.UtcNow;

                if (cashDispensed)
                {
                    account.Balance -= transaction.Amount;
                    transaction.BalanceAfter = account.Balance;
                }
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    throw new InvalidOperationException("Concurrency conflict while confirming dispense. Please retry.");
                }
                await dbTransaction.CommitAsync();

            }

            catch
            {
                await dbTransaction.RollbackAsync();
                throw;
            }
        }

        public async Task UpdateAsync(Account account)
        {
            _context.Accounts.Update(account);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Surface concurrency conflicts to caller
                throw new InvalidOperationException("Concurrency conflict when updating account. Please retry the operation.");
            }
        }
    }
}
