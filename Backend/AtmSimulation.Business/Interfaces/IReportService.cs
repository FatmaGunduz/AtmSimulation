using AtmSimulation.Application.DTOs;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;


namespace AtmSimulation.Business.Interfaces
{
    public interface IReportService
    {
        Task<List<Transaction>> GetRawTransactionsAsync();
        Task<List<TransactionResponseDto>> GetAllTransactionsAsync();

        Task<List<AuditLog>> GetAllAuditLogsAsync();
    }
}
