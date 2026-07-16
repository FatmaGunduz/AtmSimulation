using AtmSimulation.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtmSimulation.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ReportController: ControllerBase
    {
        private readonly IReportService _reportService;
        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetAllTransactions()
        {
            var transactions = await _reportService.GetAllTransactionsAsync();
            return Ok(transactions);
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAllAuditLogs()
        {
            var logs = await _reportService.GetAllAuditLogsAsync();
            return Ok(logs);
      
        }
    }
}
