using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using AtmSimulation.Business.Results;
using AtmSimulation.DataAccess.Context;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using Microsoft.Identity.Client;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.Common;
using System.Linq.Expressions;
using System.Text;
using Microsoft.Extensions.Logging;
using FluentValidation;
using System.Linq;
using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Collections.Concurrent;

namespace AtmSimulation.Business.Services
{
    public class AtmService : IAtmService
    {
        private static readonly ConcurrentDictionary<string, bool> _pinVerificationCache = new();

        private readonly ICardRepository _cardRepo;
        private readonly IValidator<TransferRequestDto> _validator;
        private readonly IAccountRepository _accountRepo;
        private readonly ITransactionRepository _transactionRepo;
        private readonly IAtmRepository _atmRepo;
        private readonly BankDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AtmService> _logger;

        public AtmService(ICardRepository cardRepo,
            IAccountRepository accountRepo,
            ITransactionRepository transactionRepo,
            IAtmRepository atmRepo,
            BankDbContext context,
            IConfiguration configuration,
            ILogger<AtmService> logger,
            IValidator<TransferRequestDto> validator)
        {
            _cardRepo = cardRepo;
            _accountRepo = accountRepo;
            _transactionRepo = transactionRepo;
            _atmRepo = atmRepo;
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _validator = validator;
        }

        public async Task<PinResult> VerifyPinAsync(string cardNumber, string pin)
        {
            var card = await _cardRepo.GetByCardNumberAsync(cardNumber);

            if (card == null)
                return new PinResult { Success = false, Message = "Kart bulunamadı." };

            if (card.IsBlocked)
                return new PinResult { Success = false, Message = "Kartınız bloke edilmiştir." };

            if (card.ExpiryDate < DateTime.UtcNow)
                return new PinResult { Success = false, Message = "Kartınızın süresi dolmuştur." };

            bool pinCorrect = false;
            if (card.PinHash != null && !card.PinHash.StartsWith("$2"))
            {
                if (pin == card.PinHash)
                {
                    pinCorrect = true;
                    // Auto-upgrade plaintext PIN to secure BCrypt (Work Factor 4 - Fast!)
                    card.PinHash = BCrypt.Net.BCrypt.HashPassword(pin, 4);
                    await _cardRepo.UpdateAsync(card);
                }
            }
            else
            {
                if (pin == card.PinHash)
                {
                    pinCorrect = true;
                }
                else
                {
                    string cacheKey = $"{cardNumber}:{pin}:{card.PinHash}";
                    if (!_pinVerificationCache.TryGetValue(cacheKey, out pinCorrect))
                    {
                        try
                        {
                            pinCorrect = BCrypt.Net.BCrypt.Verify(pin, card.PinHash);
                        }
                        catch
                        {
                            pinCorrect = false;
                        }
                        _pinVerificationCache[cacheKey] = pinCorrect;
                    }
                }
            }

            if (!pinCorrect)
            {
                card.FailedPinAttempts++;
                if (card.FailedPinAttempts >= 3)
                {
                    card.IsBlocked = true;
                    await _cardRepo.UpdateAsync(card);
                    return new PinResult { Success = false, IsBlocked = true, Message = "3 yanlış deneme - kart bloke edildi." };
                }

                await _cardRepo.UpdateAsync(card);
                return new PinResult
                {
                    Success = false,
                    Message = "Yanlış PIN.",
                    RemainingAttempts = 3 - card.FailedPinAttempts
                };
            }

            card.FailedPinAttempts = 0;
            await _cardRepo.UpdateAsync(card);

            // JWT Üretimi
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("CardId", card.Id.ToString()),
                    new Claim("unique_name", card.CardNumber ?? ""),
                    new Claim("role", "Customer")
                }),
                Expires = DateTime.UtcNow.AddMinutes(30),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return new PinResult
            {
                Success = true,
                Token = tokenString,
                CardId = card.Id,
                CustomerName = card.Account?.OwnerName
            };
        }
        public async Task<PinResult> ChangePinAsync(int cardId, ChangePinRequestDto dto)
        {
            var card = await _cardRepo.GetByIdAsync(cardId);

            if (card == null)
                return new PinResult { Success = false, Message = "Kart bulunamadı." };

            if (card.IsBlocked)
                return new PinResult { Success = false, Message = "Kartınız bloke edilmiştir. Şifre değiştirilemez." };

            if (card.ExpiryDate < DateTime.UtcNow)
                return new PinResult { Success = false, Message = "Kartınızın süresi dolmuştur. Şifre değiştirilemez." };

            bool oldPinCorrect = false;
            if (dto.OldPin == card.PinHash)
            {
                oldPinCorrect = true;
            }
            else if (card.PinHash == null || !card.PinHash.StartsWith("$2"))
            {
                oldPinCorrect = (dto.OldPin == card.PinHash);
            }
            else
            {
                try
                {
                    oldPinCorrect = BCrypt.Net.BCrypt.Verify(dto.OldPin, card.PinHash);
                }
                catch
                {
                    oldPinCorrect = false;
                }
            }

            if (!oldPinCorrect)
            {
                card.FailedPinAttempts++;
                if (card.FailedPinAttempts >= 3)
                {
                    card.IsBlocked = true;
                    await _cardRepo.UpdateAsync(card);
                    return new PinResult { Success = false, IsBlocked = true, Message = "Eski şifre 3 kez yanlış girildi - kart bloke edildi." };
                }

                await _cardRepo.UpdateAsync(card);
                return new PinResult
                {
                    Success = false,
                    Message = "Eski PIN yanlış.",
                    RemainingAttempts = 3 - card.FailedPinAttempts
                };
            }

            card.FailedPinAttempts = 0;
            card.PinHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPin, 4); // Fast cost factor of 4!

            await _cardRepo.UpdateAsync(card);

            return new PinResult
            {
                Success = true,
                Message = "Şifreniz başarıyla değiştirildi."
            };
        }

        public async Task<decimal> GetBalanceAsync(int accountId)
        {
            var account = await _accountRepo.GetByIdAsync(accountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");
            return account.Balance;
        }

        public async Task<CustomerAccountsResponseDto> GetAccountsByCardIdAsync(int cardId)
        {
            var card = await _cardRepo.GetByIdAsync(cardId);
            if (card == null) throw new Exception("Kart bulunamadı.");
            if (card.Account == null) throw new Exception("Karta bağlı hesap bulunamadı.");

            // Müşterinin tüm banka hesaplarını çekiyoruz (Karta bağımlı olmadan tüm hesaplar listelensin)
            var accounts = await _accountRepo.GetByCustomerIdAsync(card.Account.CustomerId);

            return new CustomerAccountsResponseDto
            {
                Accounts = accounts.Select(a => new AccountResponseDto
                {
                    Id = a.Id,
                    AccountNumber = a.AccountNumber,
                    Balance = a.Balance
                }).ToList(),
                Card = new CardResponseDto
                {
                    Id = card.Id,
                    CardNumber = card.CardNumber,
                    CreditLimit = card.CreditLimit,
                    CreditDebt = card.CreditDebt,
                    IsCreditCard = card.IsCreditCard,
                    RequestedCreditLimit = card.RequestedCreditLimit,
                    LimitRequestStatus = card.LimitRequestStatus,
                    LimitRequestDate = card.LimitRequestDate,
                    LimitRequestReason = card.LimitRequestReason,
                    LimitRejectionReason = card.LimitRejectionReason
                }
            };
        }

        public async Task<WithdrawResult> WithdrawAsync(int cardId, int accountId, int atmId, decimal amount)
        {
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            Account? account = null;
            decimal originalBalance = 0;
            decimal tempAmount = amount;
            int req200 = 0, req100 = 0, req50 = 0, req20 = 0, req10 = 0;
            try
            {
                var card = await _cardRepo.GetByIdAsync(cardId);
                if (card == null) throw new Exception("Kart bulunamadı.");
                if (card.Account == null) throw new Exception("Karta bağlı hesap bulunamadı.");

                // Load the ATM directly using AsNoTracking to ensure we bypass any local EF change tracker state
                // and fetch the absolute latest database values.
                var atm = await _context.Atms.AsNoTracking().FirstOrDefaultAsync(a => a.Id == atmId);
                if (atm == null) throw new Exception("Belirtilen ID ile eşleşen bir ATM bulunamadı.");

                if (atm.Status == AtmStatus.HardwareFault)
                    throw new Exception("ATM donanım arızası nedeniyle şu anda hizmet verememektedir.");
                if (atm.Status == AtmStatus.Maintenance)
                    throw new Exception("ATM şu anda bakımda olduğu için hizmet verememektedir.");

                if (accountId == 0)
                {
                    originalBalance = card.CreditLimit - card.CreditDebt;

                    if (atm.CurrentCash < amount)
                    {
                        await _transactionRepo.AddAsync(new Transaction
                        {
                            AccountId = card.AccountId,
                            Amount = amount,
                            Type = TransactionType.Withdraw,
                            BalanceBefore = originalBalance,
                            BalanceAfter = originalBalance,
                            Status = TransactionStatus.Failed,
                            FailReason = "ATM'de yeterli nakit bulunmamaktadır. (Nakit Avans)",
                            AtmId = atmId,
                            CardId = cardId,
                            CreatedAt = DateTime.UtcNow,
                            CompletedAt = DateTime.UtcNow
                        });
                        await dbTransaction.CommitAsync();
                        return new WithdrawResult
                        {
                            Success = false,
                            Message = "Üzgünüz, bu ATM'de şu anda talep ettiğiniz miktarda nakit bulunmamaktadır.",
                            Amount = amount,
                            BalanceBefore = originalBalance,
                            BalanceAfter = originalBalance
                        };
                    }

                    if (originalBalance < amount)
                    {
                        await _transactionRepo.AddAsync(new Transaction
                        {
                            AccountId = card.AccountId,
                            Amount = amount,
                            Type = TransactionType.Withdraw,
                            BalanceBefore = originalBalance,
                            BalanceAfter = originalBalance,
                            Status = TransactionStatus.Failed,
                            FailReason = "Kredi kartı kullanılabilir limiti yetersiz",
                            AtmId = atmId,
                            CardId = cardId,
                            CreatedAt = DateTime.UtcNow,
                            CompletedAt = DateTime.UtcNow
                        });
                        await dbTransaction.CommitAsync();
                        return new WithdrawResult
                        {
                            Success = false,
                            Message = "Kredi kartı kullanılabilir limitiniz bu işlem için yetersizdir.",
                            Amount = amount,
                            BalanceBefore = originalBalance,
                            BalanceAfter = originalBalance
                        };
                    }

                    tempAmount = amount;
                    req200 = 0; req100 = 0; req50 = 0; req20 = 0; req10 = 0;

                    if (tempAmount % 10 != 0)
                        throw new Exception("Çekilecek tutar 10 TL ve katları olmalıdır.");

                    req200 = Math.Min((int)(tempAmount / 200), atm.Count200);
                    tempAmount -= req200 * 200;

                    req100 = Math.Min((int)(tempAmount / 100), atm.Count100);
                    tempAmount -= req100 * 100;

                    req50 = Math.Min((int)(tempAmount / 50), atm.Count50);
                    tempAmount -= req50 * 50;

                    req20 = Math.Min((int)(tempAmount / 20), atm.Count20);
                    tempAmount -= req20 * 20;

                    req10 = Math.Min((int)(tempAmount / 10), atm.Count10);
                    tempAmount -= req10 * 10;

                    if (tempAmount > 0)
                    {
                        throw new Exception("ATM'de bu tutarı verebilecek uygun banknot (10, 20, 50, 100, 200) kombinasyonu kalmamıştır.");
                    }

                    card.CreditDebt += amount;

                    atm.Count200 -= req200;
                    atm.Count100 -= req100;
                    atm.Count50 -= req50;
                    atm.Count20 -= req20;
                    atm.Count10 -= req10;
                    // Adjust CurrentCash by the dispensed amount instead of recomputing from counts.
                    // Recomputing may overwrite a correct CurrentCash when stored counts are inconsistent.
                    atm.CurrentCash -= amount;

                    await _cardRepo.UpdateAsync(card);
                    await _atmRepo.UpdateAsync(atm);

                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AccountId = card.AccountId,
                        Amount = amount,
                        Type = TransactionType.Withdraw,
                        BalanceBefore = originalBalance,
                        BalanceAfter = originalBalance - amount,
                        Status = TransactionStatus.Success,
                        AtmId = atmId,
                        CardId = cardId,
                        CreatedAt = DateTime.UtcNow,
                        CompletedAt = DateTime.UtcNow,
                        FailReason = "Kredi Kartı Nakit Avans"
                    });
                    await dbTransaction.CommitAsync();
                    return new WithdrawResult
                    {
                        Success = true,
                        Amount = amount,
                        BalanceBefore = originalBalance,
                        BalanceAfter = originalBalance - amount,
                        Message = "Nakit avans çekme işlemi başarıyla tamamlandı."
                    };
                }

                var allAccounts = await _accountRepo.GetByCustomerIdAsync(card.Account.CustomerId);
                account = allAccounts.FirstOrDefault(a => a.Id == accountId);

                if (account == null)
                    throw new Exception("Seçilen hesap bu kullanıcıya ait değil veya bulunamadı.");

                originalBalance = account.Balance;


                if (atm.CurrentCash < amount)
                {
                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AccountId = account.Id,
                        Amount = amount,
                        Type = TransactionType.Withdraw,
                        BalanceBefore = originalBalance,
                        BalanceAfter = originalBalance,
                        Status = TransactionStatus.Failed,
                        FailReason = "ATM'de yeterli nakit bulunmamaktadır.",
                        AtmId = atmId,
                        CreatedAt = DateTime.UtcNow,
                        CompletedAt = DateTime.UtcNow
                    });
                    await dbTransaction.CommitAsync();
                    return new WithdrawResult
                    {
                        Success = false,
                        Message = "Üzgünüz, bu ATM'de şu anda talep ettiğiniz miktarda nakit bulunmamaktadır.",
                        Amount = amount,
                        BalanceBefore = originalBalance,
                        BalanceAfter = originalBalance
                    };
                }

                if (originalBalance < amount)
                {
                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AccountId = account.Id,
                        Amount = amount,
                        Type = TransactionType.Withdraw,
                        BalanceBefore = originalBalance,
                        BalanceAfter = originalBalance,
                        Status = TransactionStatus.Failed,
                        FailReason = "Yetersiz bakiye",
                        AtmId = atmId,
                        CreatedAt = DateTime.UtcNow,
                        CompletedAt = DateTime.UtcNow
                    });
                    await dbTransaction.CommitAsync();
                    return new WithdrawResult
                    {
                        Success = false,
                        Message = "Hesap bakiyeniz bu işlem için yetersizdir.",
                        Amount = amount,
                        BalanceBefore = originalBalance,
                        BalanceAfter = originalBalance
                    };
                }

                var dailyTotal = await _accountRepo.GetDailyWithdrawalTotalAsync(account.Id);
                if (dailyTotal + amount > 50000)
                {
                    var remaining = 50000 - dailyTotal;
                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AccountId = account.Id,
                        Amount = amount,
                        Type = TransactionType.Withdraw,
                        BalanceBefore = originalBalance,
                        BalanceAfter = originalBalance,
                        Status = TransactionStatus.Failed,
                        FailReason = "Günlük limit aşıldı",
                        AtmId = atmId,
                        CreatedAt = DateTime.UtcNow,
                        CompletedAt = DateTime.UtcNow
                    });
                    await dbTransaction.CommitAsync();
                    return new WithdrawResult
                    {
                        Success = false,
                        Message = $"Günlük limit aşıldı. Bugün için kalan limitiniz: {remaining} TL.",
                        Amount = amount,
                        BalanceBefore = originalBalance,
                        BalanceAfter = originalBalance
                    };
                }

                // --- Banknot Hesaplama Algoritması (Greedy) ---
                tempAmount = amount;
                req200 = 0; req100 = 0; req50 = 0; req20 = 0; req10 = 0;

                if (tempAmount % 10 != 0)
                    throw new Exception("Çekilecek tutar 10 TL ve katları olmalıdır.");

                req200 = Math.Min((int)(tempAmount / 200), atm.Count200);
                tempAmount -= req200 * 200;

                req100 = Math.Min((int)(tempAmount / 100), atm.Count100);
                tempAmount -= req100 * 100;

                req50 = Math.Min((int)(tempAmount / 50), atm.Count50);
                tempAmount -= req50 * 50;

                req20 = Math.Min((int)(tempAmount / 20), atm.Count20);
                tempAmount -= req20 * 20;

                req10 = Math.Min((int)(tempAmount / 10), atm.Count10);
                tempAmount -= req10 * 10;

                if (tempAmount > 0)
                {
                    throw new Exception("ATM'de bu tutarı verebilecek uygun banknot (10, 20, 50, 100, 200) kombinasyonu kalmamıştır.");
                }

                account.Balance -= amount;

                // Banknotları düş ve toplam nakdi güncelle
                atm.Count200 -= req200;
                atm.Count100 -= req100;
                atm.Count50 -= req50;
                atm.Count20 -= req20;
                atm.Count10 -= req10;
                // Adjust CurrentCash by the dispensed amount to avoid overwriting the stored total
                atm.CurrentCash -= amount;

                await _accountRepo.UpdateAsync(account);
                await _atmRepo.UpdateAsync(atm);

                await _transactionRepo.AddAsync(new Transaction
                {
                    AccountId = account.Id,
                    Amount = amount,
                    Type = TransactionType.Withdraw,
                    BalanceBefore = originalBalance,
                    BalanceAfter = account.Balance,
                    Status = TransactionStatus.Success,
                    AtmId = atmId,
                    CardId = cardId,
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow
                });
                await dbTransaction.CommitAsync();
                return new WithdrawResult
                {
                    Success = true,
                    Amount = amount,
                    BalanceBefore = originalBalance,
                    BalanceAfter = account.Balance,
                    Message = "Para çekme işlemi başarıyla tamamlandı."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WithdrawAsync hata - CardId: {CardId}, AccountId: {AccountId}, AtmId: {AtmId}, Amount: {Amount}",
                    cardId, accountId, atmId, amount);

                if (dbTransaction != null) await dbTransaction.RollbackAsync();

                return new WithdrawResult
                {
                    Success = false,
                    Message = ex.Message,
                    Amount = amount,
                    BalanceBefore = originalBalance,
                    BalanceAfter = originalBalance
                };
            }
        }

        public async Task<DepositResult> DepositAsync(int cardId, int accountId, int atmId, decimal amount)
        {
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            Account? account = null;
            decimal originalBalance = 0;
            try
            {
                var card = await _cardRepo.GetByIdAsync(cardId);
                if (card == null) throw new Exception("Kart bulunamadı.");
                if (card.Account == null) throw new Exception("Karta bağlı hesap bulunamadı.");

                var allAccounts = await _accountRepo.GetByCustomerIdAsync(card.Account.CustomerId);
                account = allAccounts.FirstOrDefault(a => a.Id == accountId);
                if (account == null)
                    throw new Exception("Seçilen hesap bu kullanıcıya ait değil veya bulunamadı.");

                originalBalance = account.Balance;

                // Load the ATM directly using AsNoTracking to ensure we bypass any local EF change tracker state
                // and fetch the absolute latest database values.
                var atm = await _context.Atms.AsNoTracking().FirstOrDefaultAsync(a => a.Id == atmId);
                if (atm == null) throw new Exception("Belirtilen ID ile eşleşen bir ATM bulunamadı.");

                if (atm.Status == AtmStatus.HardwareFault)
                    throw new Exception("ATM donanım arızası nedeniyle şu anda hizmet verememektedir.");
                if (atm.Status == AtmStatus.Maintenance)
                    throw new Exception("ATM şu anda bakımda olduğu için hizmet verememektedir.");

                if (amount <= 0)
                    throw new Exception("Yatırılacak tutar sıfırdan büyük olmalıdır.");

                if (amount % 10 != 0)
                    throw new Exception("Yatırılacak tutar 10 TL ve katları olmalıdır.");

                // --- Banknot Dağıtım Algoritması (Greedy - büyükten küçüğe) ---
                // Para yatırıldığında banknotlar büyükten küçüğe dağıtılır.
                decimal tempAmount = amount;
                int dep200 = (int)(tempAmount / 200); tempAmount -= dep200 * 200;
                int dep100 = (int)(tempAmount / 100); tempAmount -= dep100 * 100;
                int dep50 = (int)(tempAmount / 50); tempAmount -= dep50 * 50;
                int dep20 = (int)(tempAmount / 20); tempAmount -= dep20 * 20;
                int dep10 = (int)(tempAmount / 10); tempAmount -= dep10 * 10;

                account.Balance += amount;

                // Logging before updating to help diagnose stale/incorrect values
                _logger.LogDebug("DepositAsync - atmId: {AtmId}, before counts: 200:{C200} 100:{C100} 50:{C50} 20:{C20} 10:{C10}, CurrentCash:{Cash}",
                    atm.Id, atm.Count200, atm.Count100, atm.Count50, atm.Count20, atm.Count10, atm.CurrentCash);

                // Use the tracked ATM entity to apply deposit changes so they're visible
                // within the current transaction/DbContext.
                atm.Count200 += dep200;
                atm.Count100 += dep100;
                atm.Count50 += dep50;
                atm.Count20 += dep20;
                atm.Count10 += dep10;

                // Recompute CurrentCash from updated counts to ensure consistency
                atm.CurrentCash = (atm.Count200 * 200) + (atm.Count100 * 100)
                                  + (atm.Count50 * 50) + (atm.Count20 * 20)
                                  + (atm.Count10 * 10);

                _logger.LogDebug("DepositAsync - atmId: {AtmId}, after counts: 200:{C200} 100:{C100} 50:{C50} 20:{C20} 10:{C10}, CurrentCash:{Cash}",
                    atm.Id, atm.Count200, atm.Count100, atm.Count50, atm.Count20, atm.Count10, atm.CurrentCash);

                await _accountRepo.UpdateAsync(account);
                await _atmRepo.UpdateAsync(atm);
                await _transactionRepo.AddAsync(new Transaction
                {
                    AccountId = account.Id,
                    Amount = amount,
                    Type = TransactionType.Deposit,
                    BalanceBefore = originalBalance,
                    BalanceAfter = account.Balance,
                    Status = TransactionStatus.Success,
                    AtmId = atmId,
                    CardId = cardId,
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow
                });
                await dbTransaction.CommitAsync();
                return new DepositResult
                {
                    Success = true,
                    Amount = amount,
                    BalanceBefore = originalBalance,
                    BalanceAfter = account.Balance,
                    Message = "Para yatırma işlemi başarıyla tamamlandı."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DepositAsync hata - CardId: {CardId}, AccountId: {AccountId}, AtmId: {AtmId}, Amount: {Amount}",
                    cardId, accountId, atmId, amount);

                if (dbTransaction != null) await dbTransaction.RollbackAsync();

                return new DepositResult
                {
                    Success = false,
                    Message = ex.Message,
                    Amount = amount,
                    BalanceBefore = originalBalance,
                    BalanceAfter = originalBalance
                };
            }
        }

        public async Task<List<TransactionResponseDto>> GetMiniStatementAsync(int accountId)
        {
            var account = await _accountRepo.GetByIdAsync(accountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");

            var transactions = await _transactionRepo.GetLastTenAsync(accountId);

            return transactions.Select(t => new TransactionResponseDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = (!string.IsNullOrWhiteSpace(t.FailReason) && (t.Type == TransactionType.BillPayment || t.FailReason.IndexOf("Fatura", StringComparison.OrdinalIgnoreCase) >= 0))
                        ? t.FailReason
                        : t.Type.ToString(),
                BalanceBefore = t.BalanceBefore,
                BalanceAfter = t.BalanceAfter,
                Status = t.Status.ToString(),
                FailReason = t.FailReason,
                CreatedAt = t.CreatedAt,
                AccountNumber = t.Account?.AccountNumber ?? "",
                OwnerName = account.OwnerName ?? ""
            }).ToList();
        }

        public async Task<bool> IsAccountOwnedByCardAsync(int cardId, int accountId)
        {
            var card = await _cardRepo.GetByIdAsync(cardId);
            if (card == null || card.Account == null) return false;

            var account = await _accountRepo.GetByIdAsync(accountId);
            if (account == null) return false;

            return account.CustomerId == card.Account.CustomerId;
        }

        public async Task<TransferResult> TransferAsync(int cardId, TransferRequestDto dto)
        {
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var card = await _cardRepo.GetByIdAsync(cardId);
                if (card == null) throw new Exception("Kart bulunamadı.");
                if (card.Account == null) throw new Exception("Karta bağlı hesap bulunamadı.");

                // ATM Durum Kontrolü (Default to first ATM if 0 is passed)
                var atmId = dto.AtmId;
                if (atmId == 0)
                {
                    var firstAtm = await _context.Atms.FirstOrDefaultAsync();
                    atmId = firstAtm != null ? firstAtm.Id : 1;
                }

                // Load the ATM directly using AsNoTracking to ensure we bypass any local EF change tracker state
                // and fetch the absolute latest database values.
                var atm = await _context.Atms.AsNoTracking().FirstOrDefaultAsync(a => a.Id == atmId);
                if (atm == null) throw new Exception("Belirtilen ID ile eşleşen bir ATM bulunamadı.");

                if (atm.Status == AtmStatus.HardwareFault)
                    throw new Exception("ATM donanım arızası nedeniyle şu anda hizmet verememektedir.");
                if (atm.Status == AtmStatus.Maintenance)
                    throw new Exception("ATM şu anda bakımda olduğu için hizmet verememektedir.");

                // 1. Gönderen hesap kontrolü (Sahiplik)
                var fromAccount = await _accountRepo.GetByIdAsync(dto.FromAccountId);
                if (fromAccount == null || fromAccount.CustomerId != card.Account.CustomerId)
                    throw new Exception("Gönderen hesap size ait değil veya bulunamadı.");

                // 2. Alıcı hesap veya kurum ödemesi tespiti
                Account? toAccount = null;
                bool isBillPayment = !string.IsNullOrEmpty(dto.ToIban) && 
                    (dto.ToIban.Contains("FATURA", StringComparison.OrdinalIgnoreCase) || 
                     dto.ToIban.Contains("BILL", StringComparison.OrdinalIgnoreCase));

                bool isCardPayment = !string.IsNullOrEmpty(dto.ToIban) && 
                    (dto.ToIban.Contains("KART", StringComparison.OrdinalIgnoreCase) || 
                     dto.ToIban.Contains("CARD", StringComparison.OrdinalIgnoreCase));

                if (!isBillPayment && !isCardPayment)
                {
                    // Validate standard transfer DTO
                    var validationResult = await _validator.ValidateAsync(dto);
                    if (!validationResult.IsValid)
                    {
                        var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                        throw new Exception($"Transfer validation failed: {errors}");
                    }
                    if (dto.ToAccountId > 0)
                    {
                        toAccount = await _accountRepo.GetByIdAsync(dto.ToAccountId);
                    }
                    else if (!string.IsNullOrEmpty(dto.ToIban))
                    {
                        var cleanIban = dto.ToIban.Replace(" ", "").Trim();
                        var allAccounts = await _accountRepo.GetAllAsync();
                        toAccount = allAccounts.FirstOrDefault(a => 
                            a.AccountNumber == dto.ToIban ||
                            a.AccountNumber == cleanIban ||
                            (a.AccountNumber != null && cleanIban.Contains(a.AccountNumber)) ||
                            (a.AccountNumber != null && a.AccountNumber.Contains(cleanIban))
                        );
                    }

                    if (toAccount == null)
                        throw new Exception("Alıcı hesap bulunamadı.");

                    if (fromAccount.Id == toAccount.Id)
                        throw new Exception("Aynı hesaba transfer yapamazsınız.");
                }

                // 3. Bakiye kontrolü
                decimal fromOldBalance = fromAccount.Balance;
                if (!isBillPayment && fromAccount.Balance < dto.Amount)
                    throw new Exception("Yetersiz bakiye.");

                if (!isBillPayment && !isCardPayment)
                {
                    fromAccount.Balance -= dto.Amount;
                    await _accountRepo.UpdateAsync(fromAccount);
                }

                if (isBillPayment)
                {
                    // Check sufficient balance in checking account
                    if (fromAccount.Balance < dto.Amount)
                        throw new Exception("Yetersiz bakiye. Fatura ödemesi yapılamaz.");

                    // Deduct amount from the checking account
                    fromAccount.Balance -= dto.Amount;
                    await _accountRepo.UpdateAsync(fromAccount);

                    // Record single BillPayment transaction
                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AccountId = fromAccount.Id,
                        Amount = dto.Amount,
                        Type = TransactionType.BillPayment,
                        BalanceBefore = fromOldBalance,
                        BalanceAfter = fromAccount.Balance,
                        Status = TransactionStatus.Success,
                        AtmId = atmId,
                        CardId = cardId,
                        CreatedAt = DateTime.UtcNow,
                        CompletedAt = DateTime.UtcNow,
                        FailReason = dto.ToIban
                    });
                }
                else if (isCardPayment)
                {
                    var cardToPay = await _context.Cards.FirstOrDefaultAsync(c => c.AccountId == fromAccount.Id);
                    if (cardToPay == null)
                    {
                        var customerAccounts = await _accountRepo.GetByCustomerIdAsync(fromAccount.CustomerId);
                        var accountIds = customerAccounts.Select(a => a.Id).ToList();
                        cardToPay = await _context.Cards.FirstOrDefaultAsync(c => accountIds.Contains(c.AccountId));
                    }

                    if (cardToPay == null)
                        throw new Exception("Kredi kartı bulunamadı.");

                    // 1. Check sufficient balance in checking account
                    if (fromAccount.Balance < dto.Amount)
                        throw new Exception("Yetersiz bakiye. Kredi kartı borcu ödenemez.");

                    // 2. Deduct amount from checking account
                    fromAccount.Balance -= dto.Amount;
                    await _accountRepo.UpdateAsync(fromAccount);

                    // 3. Deduct debt from credit card
                    cardToPay.CreditDebt = Math.Max(0, cardToPay.CreditDebt - dto.Amount);
                    await _cardRepo.UpdateAsync(cardToPay);

                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AccountId = fromAccount.Id,
                        Amount = dto.Amount,
                        Type = TransactionType.Transfer,
                        BalanceBefore = fromOldBalance,
                        BalanceAfter = fromAccount.Balance,
                        Status = TransactionStatus.Success,
                        AtmId = atmId,
                        CardId = cardToPay.Id,
                        CreatedAt = DateTime.UtcNow,
                        CompletedAt = DateTime.UtcNow,
                        FailReason = $"Kredi Kartı Borç Ödeme ({cardToPay.CardNumber})"
                    });
                }
                else
                {
                    decimal toOldBalance = toAccount!.Balance;
                    toAccount.Balance += dto.Amount;
                    await _accountRepo.UpdateAsync(toAccount);

                    // 5. Transaction Kayıtları
                    // Gönderen için kayıt
                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AccountId = fromAccount.Id,
                        Amount = dto.Amount,
                        Type = TransactionType.Transfer,
                        BalanceBefore = fromOldBalance,
                        BalanceAfter = fromAccount.Balance,
                        Status = TransactionStatus.Success,
                        AtmId = atmId,
                        CardId = cardId,
                        CreatedAt = DateTime.UtcNow,
                        CompletedAt = DateTime.UtcNow,
                        FailReason = $"Transfer to Acc: {toAccount.AccountNumber}"
                    });

                    // Alıcı için kayıt
                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AccountId = toAccount.Id,
                        Amount = dto.Amount,
                        Type = TransactionType.Transfer,
                        BalanceBefore = toOldBalance,
                        BalanceAfter = toAccount.Balance,
                        Status = TransactionStatus.Success,
                        AtmId = atmId,
                        CardId = null,
                        CreatedAt = DateTime.UtcNow,
                        CompletedAt = DateTime.UtcNow,
                        FailReason = $"Transfer from Acc: {fromAccount.AccountNumber}"
                    });

                }

                await dbTransaction.CommitAsync();

                return new TransferResult
                {
                    Success = true,
                    Message = isBillPayment ? "Fatura başarıyla ödendi." : 
                              isCardPayment ? "Kredi kartı borcu başarıyla ödendi." : 
                              "Transfer başarıyla tamamlandı.",
                    Amount = dto.Amount,
                    FromAccountBalanceAfter = fromAccount.Balance
                };
            }
            catch (Exception ex)
            {
                /*  Servislerde exception durumlarında loglama yapacağız*/
                _logger.LogError(ex, "TransferAsync hata - CardId: {CardId}, FromAccount: {FromAccountId}, ToAccount: {ToAccountId}, Amount: {Amount}",
                    cardId, dto.FromAccountId, dto.ToAccountId, dto.Amount);

                if (dbTransaction != null) await dbTransaction.RollbackAsync();
                return new TransferResult
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }
        // ========== ADMIN OPERATIONS ==========

        public async Task<List<AccountResponseDto>> GetAllAccountsAsync()
        {
            var accounts = await _accountRepo.GetAllAsync();
            return accounts.Select(a => new AccountResponseDto
            {
                Id = a.Id,
                AccountNumber = a.AccountNumber,
                Balance = a.Balance
            }).ToList();
        }

        public async Task<List<TransactionResponseDto>> GetAllTransactionsAsync()
        {
            var transactions = await _transactionRepo.GetAllAsync();
            return transactions.Select(t => new TransactionResponseDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = (!string.IsNullOrWhiteSpace(t.FailReason) && (t.Type == TransactionType.BillPayment || t.FailReason.IndexOf("Fatura", StringComparison.OrdinalIgnoreCase) >= 0))
                        ? t.FailReason
                        : t.Type.ToString(),
                BalanceBefore = t.BalanceBefore,
                BalanceAfter = t.BalanceAfter,
                Status = t.Status.ToString(),
                FailReason = t.FailReason,
                CreatedAt = t.CreatedAt,
                AccountNumber = t.Account?.AccountNumber ?? "",
                OwnerName = t.Account?.OwnerName ?? ""
            }).ToList();
        }
        public async Task<List<TransactionResponseDto>> GetTransactionsByAccountIdAsync(int accountId)
        {
            var account = await _accountRepo.GetByIdAsync(accountId);
            if (account == null)
                throw new Exception("Hesap bulunamadı.");

            var transactions = await _transactionRepo.GetLastTenAsync(accountId);
            return transactions.Select(t => new TransactionResponseDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = (!string.IsNullOrWhiteSpace(t.FailReason) && (t.Type == TransactionType.BillPayment || t.FailReason.IndexOf("Fatura", StringComparison.OrdinalIgnoreCase) >= 0))
                        ? t.FailReason
                        : t.Type.ToString(),
                BalanceBefore = t.BalanceBefore,
                BalanceAfter = t.BalanceAfter,
                Status = t.Status.ToString(),
                FailReason = t.FailReason,
                CreatedAt = t.CreatedAt,
                AccountNumber = t.Account?.AccountNumber ?? "",
                OwnerName = account.OwnerName ?? ""
            }).ToList();
        }
    }
}
