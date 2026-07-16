using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Services
{
    public class ReportService : IReportService
    {
        private readonly ITransactionRepository _transactionRepo;
        public ReportService(ITransactionRepository transactionRepo)
        {
            _transactionRepo = transactionRepo;
        }
        public async Task<List<AuditLog>> GetAllAuditLogsAsync()
        {
            return await _transactionRepo.GetAllAuditLogsAsync();
        }

        public async Task<List<Transaction>> GetRawTransactionsAsync()
        {
            return await _transactionRepo.GetAllAsync();
        }

        public async Task<List<TransactionResponseDto>> GetAllTransactionsAsync()
        {
            var transactions = await _transactionRepo.GetAllAsync();
            return transactions.Select(t => new TransactionResponseDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = t.Type.ToString(),
                BalanceBefore = t.BalanceBefore,
                BalanceAfter = t.BalanceAfter,
                Status = t.Status.ToString(),
                FailReason = t.FailReason,
                CreatedAt = t.CreatedAt,
                AccountNumber = t.Account?.AccountNumber ?? "",
                OwnerName = t.Account?.OwnerName ?? ""
            }).ToList();
        }
    }
}
