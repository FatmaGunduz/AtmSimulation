using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using AtmSimulation.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AtmSimulation.DataAccess.Context;

namespace AtmSimulation.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ICardService _cardService;
        private readonly BankDbContext _context;

        public AdminController(IAdminService adminService, ICardService cardService, BankDbContext context)
        {
            _adminService = adminService;
            _cardService = cardService;
            _context = context;
        }

        private int GetAdminIdFromClaims()
        {
            var claim = User.Claims.FirstOrDefault(c =>
                c.Type.Equals("AdminId", StringComparison.OrdinalIgnoreCase) ||
                c.Type.Equals("sub", StringComparison.OrdinalIgnoreCase));

            return claim != null ? int.Parse(claim.Value) : 0;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] AdminLoginDto dto)
        {
            var result = await _adminService.LoginAsync(dto);
            if (!result.Success)
                return Unauthorized(result);
            return Ok(result);
        }

        [HttpGet("credit-limit-requests/pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingCreditLimitRequests()
        {
            var requests = await _cardService.GetPendingLimitRequestsAsync();
            return Ok(new
            {
                Count = requests.Count,
                Data = requests
            });
        }

        [HttpGet("credit-limit-requests")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllCreditLimitRequests()
        {
            var requests = await _cardService.GetAllLimitRequestsAsync();
            return Ok(new
            {
                Count = requests.Count,
                Data = requests
            });
        }

        [HttpPost("credit-limit-requests/{cardId}/decision")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DecideCreditLimitRequest(int cardId, [FromBody] ApproveCreditLimitIncreaseDto dto)
        {
            try
            {
                var adminId = GetAdminIdFromClaims();
                if (adminId == 0) return Unauthorized();

                var result = await _cardService.ApproveLimitIncreaseAsync(cardId, adminId, dto.IsApproved, dto.RejectionReason);

                return Ok(new
                {
                    Message = dto.IsApproved
                        ? "Kredi limit talebi onaylandı."
                        : "Kredi limit talebi reddedildi.",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("all-atms")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            Console.WriteLine("--> API: GetAllAtms isteği alındı.");
            var atms = await _adminService.GetAllAtmsAsync();
            Console.WriteLine($"--> API: {atms.Count} adet ATM bulundu.");
            return Ok(atms);
        }

        [HttpPatch("update-atm-status/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAtmStatus(int id, [FromBody] UpdateAtmStatusDto dto)
        {
            try
            {
                var updatedAtm = await _adminService.UpdateAtmStatusAsync(id, dto);

                if (updatedAtm == null)
                    return NotFound(new { Message = "Böyle bir ATM bulunamadı." });

                return Ok(new
                {
                    Message = "ATM durumu başarıyla güncellendi.",
                    AtmId = id,
                    NewStatus = updatedAtm.Status.ToString(),
                    CurrentCash = updatedAtm.CurrentCash,
                    Count200 = updatedAtm.Count200,
                    Count100 = updatedAtm.Count100,
                    Count50 = updatedAtm.Count50,
                    Count20 = updatedAtm.Count20,
                    Count10 = updatedAtm.Count10
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("add-atm")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddAtm(
            [FromQuery] string name,
            [FromQuery] string location,
            [FromQuery] int c200 = 0,
            [FromQuery] int c100 = 0,
            [FromQuery] int c50 = 0,
            [FromQuery] int c20 = 0,
            [FromQuery] int c10 = 0)
        {
            try
            {
                var newAtm = await _adminService.AddAtmAsync(name, location, c200, c100, c50, c20, c10);

                return Ok(new
                {
                    Message = "Yeni ATM başarıyle eklendi.",
                    Id = newAtm.Id,
                    Name = newAtm.Name,
                    Location = newAtm.Location,
                    CurrentCash = newAtm.CurrentCash,
                    Count200 = newAtm.Count200,
                    Count100 = newAtm.Count100,
                    Count50 = newAtm.Count50,
                    Count20 = newAtm.Count20,
                    Count10 = newAtm.Count10,
                    Status = newAtm.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("add-issue/{atmId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddIssue(int atmId, [FromBody] AddIssueDto dto)
        {
            try
            {
                var atm = await _context.Atms.FindAsync(atmId);
                if (atm == null) return NotFound(new { Message = "ATM bulunamadı." });

                var issuesList = string.IsNullOrEmpty(atm.Issues)
                    ? new List<string>()
                    : atm.Issues.Split(';').Select(i => i.Trim()).ToList();

                if (!issuesList.Contains(dto.Issue))
                {
                    issuesList.Add(dto.Issue);
                    atm.Issues = string.Join(";", issuesList);
                }

                atm.Status = AtmStatus.HardwareFault;
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Arıza bildirildi.", Issues = atm.Issues });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPatch("fix-atm-issue/{atmId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> FixAtmIssue(int atmId)
        {
            try
            {
                var atm = await _context.Atms.FindAsync(atmId);
                if (atm == null) return NotFound(new { Message = "ATM bulunamadı." });

                atm.Issues = null;
                atm.Status = AtmStatus.Active;
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Arızalar giderildi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("logs")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetLogs()
        {
            try
            {
                var transactions = await _context.Transactions
                    .Include(t => t.Account)
                    .OrderByDescending(t => t.CreatedAt)
                    .Take(100)
                    .ToListAsync();

                var logs = transactions.Select(t => new
                {
                    Id = t.Id,
                    AtmId = t.AtmId,
                    CustomerName = t.Account != null ? t.Account.OwnerName : "Bilinmiyor",
                    Type = t.Type.ToString(),
                    Amount = t.Amount,
                    CreatedAt = t.CreatedAt,
                    Status = t.Status == TransactionStatus.Success ? "SUCCESS" : "FAILED"
                });

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class AddIssueDto
    {
        public string Issue { get; set; } = string.Empty;
    }
}
