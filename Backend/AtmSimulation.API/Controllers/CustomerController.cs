using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtmSimulation.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;
        public CustomerController(ICustomerService customerService)
        {
            _customerService = customerService;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customers = await _customerService.GetAllCustomersAsync();
            return Ok(customers.Select(x => new
            {
                x.Id,
                x.FullName,
                x.Email,
                // Tüm hesaplardaki herhangi bir kart bloke ise müşteriyi blokeli sayalım (Örnek mantık)
                IsBlocked = x.Accounts.Any(a => a.Cards.Any(c => c.IsBlocked)),
                Accounts = x.Accounts.Select(a => new {
                    a.Id,
                    a.AccountNumber,
                    a.Balance,
                    Cards = a.Cards.Select(c => new {
                        c.Id,
                        c.CardNumber,
                        c.IsBlocked,
                        c.ExpiryDate,
                        c.CreditLimit,
                        c.CreditDebt,
                        c.IsCreditCard
                    })
                })
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var customer = await _customerService.GetByIdAsync(id);
                if (customer == null)
                    return NotFound(new { Message = "Müşteri bulunamadı." });

                return Ok(new
                {
                    customer.Id,
                    customer.FullName,
                    customer.Email,
                    IsBlocked = customer.Accounts.Any(a => a.Cards.Any(c => c.IsBlocked)),
                    Accounts = customer.Accounts.Select(a => new {
                        a.Id,
                        a.AccountNumber,
                        a.Balance,
                        Cards = a.Cards.Select(c => new {
                            c.Id,
                            c.CardNumber,
                            c.IsBlocked,
                            c.ExpiryDate,
                            c.CreditLimit,
                            c.CreditDebt,
                            c.IsCreditCard
                        })
                    })
                });
            }
            catch (Exception ex)
            {
                return NotFound(new { Message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
        {
            try
            {
                var customer = await _customerService.CreateCustomerAsync(dto);
                    return Ok(new
                    {
                        customer.Id,
                        customer.FullName,
                        customer.Email
                    });

            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _customerService.DeleteCustomerAsync(id);
                return Ok(new { Message = "Müşteri silindi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
