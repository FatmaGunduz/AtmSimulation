using AtmSimulation.Application.DTOs;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Interfaces
{
    public interface ICardService
    {
        Task<Card> CreateCardAsync(CreateCardDto dto);
        Task<List<Card>> GetAllCardsAsync();
        Task<Card?> GetByIdAsync(int cardId);
        Task UnblockCardAsync(UnblockCardDto dto);
        Task DeleteCardAsync(int cardId);

        // Limit Increase Request Methods
        Task<CreditLimitRequestResponseDto> RequestCreditLimitIncreaseAsync(int cardId, RequestCreditLimitIncreaseDto dto);
        Task<CreditLimitRequestResponseDto?> GetMyLimitRequestAsync(int cardId);
        Task<List<CreditLimitRequestResponseDto>> GetPendingLimitRequestsAsync();
        Task<List<CreditLimitRequestResponseDto>> GetAllLimitRequestsAsync();
        Task<CreditLimitRequestResponseDto> ApproveLimitIncreaseAsync(int cardId, int adminId, bool isApproved, string? rejectionReason = null);
    }
}
