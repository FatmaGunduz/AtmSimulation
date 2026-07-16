using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AtmSimulation.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CardController(ICardService cardService) : ControllerBase
    {
        private int GetCardIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c =>
                c.Type.Equals("CardId", StringComparison.OrdinalIgnoreCase) ||
                c.Type.EndsWith("cardid", StringComparison.OrdinalIgnoreCase));

            return claim != null ? int.Parse(claim.Value) : 0;
        }

        private int GetAdminIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c =>
                c.Type.Equals("AdminId", StringComparison.OrdinalIgnoreCase) ||
                c.Type.Equals("sub", StringComparison.OrdinalIgnoreCase));

            return claim != null ? int.Parse(claim.Value) : 0;
        }

        // ==== CUSTOMER ENDPOINTS ====

        /// <summary>
        /// Müşteri kendi kartı için kredi limit artırım talebinde bulunur.
        /// </summary>
        [HttpPost("request-limit-increase")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> RequestLimitIncrease([FromBody] RequestCreditLimitIncreaseDto dto)
        {
            try
            {
                var cardId = GetCardIdFromClaims();
                if (cardId == 0) return Unauthorized();

                var result = await cardService.RequestCreditLimitIncreaseAsync(cardId, dto);
                return Ok(new
                {
                    Message = "Kredi limit artırım talebiniz alındı. Admin onayı bekleniyor.",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Müşteri kendi mevcut limit talebinin durumunu sorgular.
        /// </summary>
        [HttpGet("my-limit-request")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyLimitRequest()
        {
            try
            {
                var cardId = GetCardIdFromClaims();
                if (cardId == 0) return Unauthorized();

                var result = await cardService.GetMyLimitRequestAsync(cardId);
                if (result == null)
                    return Ok(new { Message = "Herhangi bir limit artırım talebiniz bulunmamaktadır." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        // ==== ADMIN ENDPOINTS ====

        /// <summary>
        /// Admin: Bekleyen (Pending) kredi limit taleplerini listeler.
        /// </summary>
        [HttpGet("pending-requests")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingRequests()
        {
            try
            {
                var requests = await cardService.GetPendingLimitRequestsAsync();
                return Ok(new
                {
                    Count = requests.Count,
                    Data = requests
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Admin: Tüm kredi limit taleplerini (bekleyen, onaylandı, reddedilen) listeler.
        /// </summary>
        [HttpGet("all-limit-requests")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllLimitRequests()
        {
            try
            {
                var requests = await cardService.GetAllLimitRequestsAsync();
                return Ok(new
                {
                    Count = requests.Count,
                    Data = requests
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Admin: Belirli bir kartın limit artırım talebini onayla veya reddet.
        /// </summary>
        [HttpPost("{id}/approve-limit-increase")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveLimitIncrease(int id, [FromBody] ApproveCreditLimitIncreaseDto dto)
        {
            try
            {
                var adminId = GetAdminIdFromClaims();
                if (adminId == 0) return Unauthorized();

                var result = await cardService.ApproveLimitIncreaseAsync(id, adminId, dto.IsApproved, dto.RejectionReason);

                var message = dto.IsApproved
                    ? $"Kart #{id} için kredi limiti artırım talebi ONAYLANDI. Yeni limit: {result.CurrentCreditLimit:C}"
                    : $"Kart #{id} için kredi limiti artırım talebi REDDEDİLDİ. Gerekçe: {dto.RejectionReason}";

                return Ok(new
                {
                    Message = message,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var cards = await cardService.GetAllCardsAsync();
            return Ok(cards.Select(x=> new
            {
                x.Id,
                x.AccountId,
                x.CardNumber,
                x.PinHash,
                x.ExpiryDate
            }));

        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task <IActionResult> GetByIdResult(int id)
        {
            try
            {
                var card = await cardService.GetByIdAsync(id);
                if (card == null)
                {
                    return NotFound(new { Message = "Kart bulunamadı." });
                }

                return Ok(new
                {
                    card.Id,
                    card.AccountId,
                    card.CardNumber,
                    card.PinHash,
                    card.ExpiryDate
                });
            }
            catch (Exception ex)
            {
                return NotFound(new { ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateCardDto dto)
        {
            try
            {
                var card = await cardService.CreateCardAsync(dto);
                return Ok(new
                {
                    card.Id,
                    card.AccountId,
                    card.CardNumber,
                    card.PinHash,
                    card.ExpiryDate
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { ex.Message });
            }
        }

        [HttpPut("unblock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Unblock([FromBody] UnblockCardDto dto)
        {
            try
            {
                await cardService.UnblockCardAsync(dto);
                return Ok(new { Message = "Kart blokesi kaldırıldı."});
            }
            catch (Exception ex)
            {
                return BadRequest(new { ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task <IActionResult> Delete(int id)
        {
            try
            {
                await cardService.DeleteCardAsync(id);
                return Ok(new { Message = "Kart silindi." });
            }
            catch(Exception ex)
            {
                return BadRequest(new { ex.Message });
            }
        }
    }
}

