using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.DataAccess.Repositories;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Services
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepo;
        private readonly ICustomerRepository _customerRepo;
        public AccountService(IAccountRepository accountRepo, ICustomerRepository customerRepo)
        {
            _accountRepo = accountRepo;
            _customerRepo = customerRepo;
        }
        public async Task<Account> CreateAccountAsync(CreateAccountDto dto, int customerId)
        {
            var customer = await _customerRepo.GetByIdAsync(customerId);
            if (customer == null)

                throw new Exception("Müşteri bulunamadı.");

            var account = new Account
            {
                AccountNumber = GenerateAccountNumber(),
                OwnerName = dto.OwnerName,
                Balance = dto.InitialBalance,
                CustomerId = customerId,
                CreatedAt = DateTime.UtcNow

            };
            await _accountRepo.AddAsync(account);
            return account;
        }

        public async Task DeleteAccountAsync(int accountId)
        {
            await _accountRepo.DeleteAsync(accountId);
        }

        public async Task<List<Account>> GetAllAccountsAsync()
        {
            return await _accountRepo.GetAllAsync();
        }

        public async Task<Account?> GetByIdAsync(int accountId)
        {
            var account = await _accountRepo.GetByIdAsync(accountId);
            if (account == null)

                throw new Exception("Hesap bulunamadı.");
            return account;

        }

        public string GenerateAccountNumber()
        {
            return "TR" + new Random()
                .Next(100000000, 999999999)
                .ToString() + DateTime.Now.Ticks.ToString().Substring(0, 15);
        }
    }
}
