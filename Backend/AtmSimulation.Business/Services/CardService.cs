using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Services
{
    public class CardService : ICardService
    {
        private readonly ICardRepository _cardRepo;
        private readonly IAccountRepository _accountRepo;
        public CardService(ICardRepository cardRepo, IAccountRepository accountRepo)
        {
            _cardRepo = cardRepo;
            _accountRepo = accountRepo;
        }
        public async Task<Card> CreateCardAsync(CreateCardDto dto)
        {
            var account = await _accountRepo.GetByIdAsync(dto.AccountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");

            if (string.IsNullOrEmpty(dto.CardNumber))
                throw new Exception("Kart numarası boş olamaz.");

            var existing = await _cardRepo.GetByCardNumberAsync(dto.CardNumber);
            if (existing != null)
                throw new Exception("Bu kart numarası zaten kayıtlı.");

            if (dto.CreditLimit <= 0)
                throw new Exception("Kredi limiti 0'dan büyük olmalıdır.");

            var card = new Card
            {
                AccountId = account.Id,
                CardNumber = dto.CardNumber,
                PinHash = BCrypt.Net.BCrypt.HashPassword(dto.Pin),
                ExpiryDate = DateTime.UtcNow.AddYears(5),
                IsBlocked = false,
                FailedPinAttempts = 0,
                CreditLimit = dto.CreditLimit,
                CreditDebt = 0

            };

            await _cardRepo.AddAsync(card);
            return card;
        }

        public async Task DeleteCardAsync(int cardId)
        {
            await _cardRepo.DeleteAsync(cardId);
        }

        public async Task<List<Card>> GetAllCardsAsync()
        {
            return await _cardRepo.GetAllAsync();
        }

        public async Task<Card?> GetByIdAsync(int cardId)
        {
            var card = await _cardRepo.GetByIdAsync(cardId);
            if (card == null)
                throw new Exception("Kart bulunamadı.");
            return card;
        }

        public async Task UnblockCardAsync(UnblockCardDto dto)
        {
            var card = await _cardRepo.GetByIdAsync(dto.CardId);
            if (card == null)
                throw new Exception("Kart bulunamadı.");
            card.IsBlocked = false;
            card.FailedPinAttempts = 0;
            await _cardRepo.UpdateAsync(card);
        }

        public async Task<CreditLimitRequestResponseDto> RequestCreditLimitIncreaseAsync(int cardId, RequestCreditLimitIncreaseDto dto)
        {
            var card = await _cardRepo.GetByIdAsync(cardId);
            if (card == null)
                throw new Exception("Kart bulunamadı.");

            if (dto.RequestedLimit <= card.CreditLimit)
                throw new Exception("Yeni limit, mevcut limitten daha yüksek olmalıdır.");

            if (dto.RequestedLimit > 250000)
                throw new Exception("Maksimum kredi limiti 250.000 TL'dir.");

            // Zaten beklemede talep varsa hata ver
            if (card.LimitRequestStatus == LimitRequestStatus.Pending)
                throw new Exception("Önceki limitinizin artırılması için yapılan talep hâlâ bekleme durumundadır.");

            card.RequestedCreditLimit = dto.RequestedLimit;
            card.LimitRequestStatus = LimitRequestStatus.Pending;
            card.LimitRequestDate = DateTime.UtcNow;
            card.LimitRequestReason = dto.Reason;
            card.LimitRejectionReason = null;
            card.ApprovedByAdminId = null;
            card.LimitApprovedDate = null;

            await _cardRepo.UpdateAsync(card);

            return new CreditLimitRequestResponseDto
            {
                CardId = card.Id,
                CardNumber = card.CardNumber,
                CurrentCreditLimit = card.CreditLimit,
                RequestedCreditLimit = card.RequestedCreditLimit,
                Status = card.LimitRequestStatus,
                RequestDate = card.LimitRequestDate,
                Reason = card.LimitRequestReason,
                RejectionReason = card.LimitRejectionReason
            };
        }

        public async Task<CreditLimitRequestResponseDto?> GetMyLimitRequestAsync(int cardId)
        {
            var card = await _cardRepo.GetByIdAsync(cardId);
            if (card == null)
                throw new Exception("Kart bulunamadı.");

            if (card.LimitRequestStatus == null)
                return null;

            return new CreditLimitRequestResponseDto
            {
                CardId = card.Id,
                CardNumber = card.CardNumber,
                CurrentCreditLimit = card.CreditLimit,
                RequestedCreditLimit = card.RequestedCreditLimit,
                Status = card.LimitRequestStatus,
                RequestDate = card.LimitRequestDate,
                Reason = card.LimitRequestReason,
                RejectionReason = card.LimitRejectionReason,
                ApprovedDate = card.LimitApprovedDate
            };
        }

        public async Task<List<CreditLimitRequestResponseDto>> GetPendingLimitRequestsAsync()
        {
            var cards = await _cardRepo.GetAllAsync();
            var pendingRequests = cards
                .Where(c => c.LimitRequestStatus == LimitRequestStatus.Pending)
                .Select(c => new CreditLimitRequestResponseDto
                {
                    CardId = c.Id,
                    CardNumber = c.CardNumber,
                    CurrentCreditLimit = c.CreditLimit,
                    RequestedCreditLimit = c.RequestedCreditLimit,
                    Status = c.LimitRequestStatus,
                    RequestDate = c.LimitRequestDate,
                    Reason = c.LimitRequestReason,
                    RejectionReason = c.LimitRejectionReason,
                    CustomerFullName = c.Account?.Customer?.FullName,
                    CustomerEmail = c.Account?.Customer?.Email
                })
                .ToList();

            return pendingRequests;
        }

        public async Task<List<CreditLimitRequestResponseDto>> GetAllLimitRequestsAsync()
        {
            var cards = await _cardRepo.GetAllAsync();
            var allRequests = cards
                .Where(c => c.LimitRequestStatus != null)
                .Select(c => new CreditLimitRequestResponseDto
                {
                    CardId = c.Id,
                    CardNumber = c.CardNumber,
                    CurrentCreditLimit = c.CreditLimit,
                    RequestedCreditLimit = c.RequestedCreditLimit,
                    Status = c.LimitRequestStatus,
                    RequestDate = c.LimitRequestDate,
                    Reason = c.LimitRequestReason,
                    RejectionReason = c.LimitRejectionReason,
                    ApprovedDate = c.LimitApprovedDate,
                    CustomerFullName = c.Account?.Customer?.FullName,
                    CustomerEmail = c.Account?.Customer?.Email
                })
                .OrderByDescending(r => r.RequestDate)
                .ToList();

            return allRequests;
        }

        public async Task<CreditLimitRequestResponseDto> ApproveLimitIncreaseAsync(int cardId, int adminId, bool isApproved, string? rejectionReason = null)
        {
            var card = await _cardRepo.GetByIdAsync(cardId);
            if (card == null)
                throw new Exception("Kart bulunamadı.");

            if (card.LimitRequestStatus != LimitRequestStatus.Pending)
                throw new Exception("Bu kartın beklemede bir talep yok.");

            if (isApproved)
            {
                if (card.RequestedCreditLimit.HasValue && card.RequestedCreditLimit > 0)
                {
                    card.CreditLimit = card.RequestedCreditLimit.Value;
                }
                card.LimitRequestStatus = LimitRequestStatus.Approved;
                card.LimitRejectionReason = null;
            }
            else
            {
                card.LimitRequestStatus = LimitRequestStatus.Rejected;
                card.LimitRejectionReason = rejectionReason;
            }

            card.ApprovedByAdminId = adminId;
            card.LimitApprovedDate = DateTime.UtcNow;

            await _cardRepo.UpdateAsync(card);

            return new CreditLimitRequestResponseDto
            {
                CardId = card.Id,
                CardNumber = card.CardNumber,
                CurrentCreditLimit = card.CreditLimit,
                RequestedCreditLimit = card.RequestedCreditLimit,
                Status = card.LimitRequestStatus,
                RequestDate = card.LimitRequestDate,
                Reason = card.LimitRequestReason,
                RejectionReason = card.LimitRejectionReason,
                ApprovedDate = card.LimitApprovedDate,
                CustomerFullName = card.Account?.Customer?.FullName,
                CustomerEmail = card.Account?.Customer?.Email
            };
        }
    }
}
