using AtmSimulation.Application.DTOs;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Interfaces
{
    public interface IAccountService
    {
        Task<Account> CreateAccountAsync(CreateAccountDto dto, int customerId);
        Task<List<Account>> GetAllAccountsAsync();
        Task<Account?> GetByIdAsync(int accountId);
        Task DeleteAccountAsync(int accountId);
    }
}
