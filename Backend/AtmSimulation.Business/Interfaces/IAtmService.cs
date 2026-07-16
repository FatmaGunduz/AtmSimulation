using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Results;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;


namespace AtmSimulation.Business.Interfaces
{
    public interface IAtmService
    {
        // PIN & Authentication
        Task<PinResult> VerifyPinAsync(string cardNumber, string pin);
        Task<PinResult> ChangePinAsync(int cardId, ChangePinRequestDto dto);

        // Customer Operations
        Task<CustomerAccountsResponseDto> GetAccountsByCardIdAsync(int cardId);
        Task<WithdrawResult> WithdrawAsync(int cardId, int accountId, int atmId, decimal amount);
        Task<DepositResult> DepositAsync(int cardId, int accountId, int atmId, decimal amount);
        Task<decimal> GetBalanceAsync(int accountId);
        Task<List<TransactionResponseDto>> GetMiniStatementAsync(int accountId);
        Task<bool> IsAccountOwnedByCardAsync(int cardId, int accountId);
        Task<TransferResult> TransferAsync(int cardId, TransferRequestDto dto);

        // Admin Operations
        Task<List<AccountResponseDto>> GetAllAccountsAsync();
        Task<List<TransactionResponseDto>> GetAllTransactionsAsync();
        Task<List<TransactionResponseDto>> GetTransactionsByAccountIdAsync(int accountId);
    }
}
