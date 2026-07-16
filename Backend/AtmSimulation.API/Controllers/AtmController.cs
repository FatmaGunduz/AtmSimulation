using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace AtmSimulation.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtmController : ControllerBase
    {
        private readonly IAtmService _atmService;
        private readonly ICardService _cardService;
        private readonly ILogger<AtmController> _logger;

        public AtmController(IAtmService atmService, ICardService cardService, ILogger<AtmController> logger)
        {
            _atmService = atmService;
            _cardService = cardService;
            _logger = logger;
        }

        private int GetCardIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c =>
                c.Type.Equals("CardId", StringComparison.OrdinalIgnoreCase) ||
                c.Type.EndsWith("cardid", StringComparison.OrdinalIgnoreCase));

            return claim != null ? int.Parse(claim.Value) : 0;
        }

        [HttpPost("verify-pin")]
        [AllowAnonymous]
        // Rate limit eklenecek kontrollerlara  1 kullanıcı 1 dakikada 5 istek atabilir tarzı bişey denebilir sana kalmıs. Servislerde catchlere loglama yapılacak
        public async Task<IActionResult> VerifyPin([FromBody] PinVerifyRequestDto req)
        {
            if (req.CardNumber == null || req.Pin == null) return BadRequest("Kart numarası ve PIN zorunludur.");
            var result = await _atmService.VerifyPinAsync(req.CardNumber, req.Pin);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("change-pin")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> ChangePin([FromBody] ChangePinRequestDto req)
        {
            var cardId = GetCardIdFromClaims();
            if (cardId == 0) return Unauthorized();

            var result = await _atmService.ChangePinAsync(cardId, req);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpGet("accounts")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetAccounts()
        {
            var cardId = GetCardIdFromClaims();
            if (cardId == 0) return Unauthorized();

            try
            {
                var accounts = await _atmService.GetAccountsByCardIdAsync(cardId);
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error GetAccounts - CardId: {cardId}. Error: {ex}");
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("card-settings")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetCardSettings()
        {
            var cardId = GetCardIdFromClaims();
            if (cardId == 0) return Unauthorized();

            try
            {
                var accounts = await _atmService.GetAccountsByCardIdAsync(cardId);
                return Ok(accounts.Card);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetCardSettings hata - CardId: {CardId}", cardId);
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("card-settings/request-credit-limit-increase")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> RequestCreditLimitIncreaseFromCardSettings([FromBody] RequestCreditLimitIncreaseDto dto)
        {
            var cardId = GetCardIdFromClaims();
            if (cardId == 0) return Unauthorized();

            try
            {
                var result = await _cardService.RequestCreditLimitIncreaseAsync(cardId, dto);
                return Ok(new
                {
                    Message = "Kredi limit artırma talebiniz alındı. Limitiniz admin onayından sonra güncellenecek.",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("card-settings/credit-limit-request")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetCreditLimitRequestStatusFromCardSettings()
        {
            var cardId = GetCardIdFromClaims();
            if (cardId == 0) return Unauthorized();

            try
            {
                var result = await _cardService.GetMyLimitRequestAsync(cardId);
                if (result == null)
                    return Ok(new { Message = "Henüz kredi limit artırma talebiniz yok." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("withdraw")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Withdraw([FromBody] WithdrawRequestDto req)
        {
            var cardId = GetCardIdFromClaims();
            if (cardId == 0) return Unauthorized();

            try
            {
                var result = await _atmService.WithdrawAsync(cardId, req.AccountId, req.AtmId, req.Amount);
                if (!result.Success)
                {
                    return BadRequest(new { Message = result.Message });
                }
                return Ok(result);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning($"Concurrency error on Withdraw - CardId: {cardId}, Amount: {req.Amount}. Error: {ex.Message}");
                return Conflict(new { Message = "İşlem sürüm uyumsuzluğu. Lütfen tekrar deneyin." });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning($"Invalid argument on Withdraw - CardId: {cardId}. Error: {ex.Message}");
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error on Withdraw - CardId: {cardId}. Error: {ex}");
                return StatusCode(500, new { Message = "Sistem hatası oluştu. Lütfen daha sonra tekrar deneyin." });
            }
        }

        [HttpPost("deposit")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Deposit([FromBody] DepositRequestDto req)
        {
            var cardId = GetCardIdFromClaims();
            if (cardId == 0) return Unauthorized();

            try
            {
                var result = await _atmService.DepositAsync(cardId, req.AccountId, req.AtmId, req.Amount);
                if (!result.Success)
                {
                    return BadRequest(new { Message = result.Message });
                }
                return Ok(result);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning($"Concurrency error on Deposit - CardId: {cardId}, Amount: {req.Amount}. Error: {ex.Message}");
                return Conflict(new { Message = "İşlem sürüm uyumsuzluğu. Lütfen tekrar deneyin." });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning($"Invalid argument on Deposit - CardId: {cardId}. Error: {ex.Message}");
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error on Deposit - CardId: {cardId}. Error: {ex}");
                return StatusCode(500, new { Message = "Sistem hatası oluştu. Lütfen daha sonra tekrar deneyin." });
            }
        }

        [HttpGet("balance/{accountId}")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> GetBalance(int accountId)
        {
            var isAdmin = User.IsInRole("Admin");
            var cardId = GetCardIdFromClaims();

            if (!isAdmin)
            {
                var isOwner = await _atmService.IsAccountOwnedByCardAsync(cardId, accountId);
                if (!isOwner) return Unauthorized("Bu hesap size ait değil.");
            }

            try
            {
                var balance = await _atmService.GetBalanceAsync(accountId);
                return Ok(new { Balance = balance });
            }
            catch (Exception ex)
            {
                return NotFound(new { Message = ex.Message });
            }
        }

        [HttpGet("statement/{accountId}")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> GetStatement(int accountId)
        {
            var isAdmin = User.IsInRole("Admin");
            var cardId = GetCardIdFromClaims();

            if (!isAdmin)
            {
                var isOwner = await _atmService.IsAccountOwnedByCardAsync(cardId, accountId);
                if (!isOwner) return Unauthorized("Bu hesap size ait değil.");
            }

            try
            {
                var statements = await _atmService.GetMiniStatementAsync(accountId);
                return Ok(statements);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("transfer")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Transfer([FromBody] TransferRequestDto dto)
        {
            var cardId = GetCardIdFromClaims();
            if (cardId == 0) return Unauthorized();

            try
            {
                var result = await _atmService.TransferAsync(cardId, dto);
                if (!result.Success)
                {
                    return BadRequest(new { Message = result.Message });
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error on Transfer - CardId: {cardId}. Error: {ex}");
                return StatusCode(500, new { Message = "Sistem hatası oluştu. Lütfen daha sonra tekrar deneyin." });
            }
        }

        // ========== ADMIN ENDPOINTS ==========

        /// <summary>
        /// Admin için: Tüm işlemleri listele
        /// </summary>
        [HttpGet("admin/transactions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllTransactions()
        {
            try
            {
                var transactions = await _atmService.GetAllTransactionsAsync();
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Admin için: Belirli hesabın tüm işlemlerini listele
        /// </summary>
        [HttpGet("admin/transactions/account/{accountId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAccountTransactions(int accountId)
        {
            try
            {
                var transactions = await _atmService.GetTransactionsByAccountIdAsync(accountId);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
