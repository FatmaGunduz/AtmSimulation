using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtmSimulation.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AccountController(IAccountService accountService) : ControllerBase
    {


        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var accounts = await accountService.GetAllAccountsAsync();
            return Ok(accounts.Select(x => new

            {
                x.Id,
                x.Balance,
                x.CustomerId,
                x.AccountNumber

            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var account = await accountService.GetByIdAsync(id);
                if (account == null)
                {
                    return NotFound(new { Message = "Hesap bulunamadı." });
                }

                return Ok(new
                {
                    account.Id,
                    account.Balance,
                    account.CustomerId
                });
            }
            catch (Exception ex)
            {
                return NotFound(new { ex.Message });
            }

        }

        [HttpPost("create/{customerId}")]
        public async Task<IActionResult> Create(int customerId, [FromBody] CreateAccountDto dto)
        {
            try
            {
                var account = await accountService.CreateAccountAsync(dto, customerId);
                return Ok(new
                {
                    account.Id,
                    account.Balance,
                    account.CustomerId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await accountService.DeleteAccountAsync(id);
                return Ok(new { Message = "Hesap silindi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { ex.Message });
            }
        }

    }
}
