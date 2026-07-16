namespace AtmSimulation.Application.DTOs
{
    public class RequestCreditLimitIncreaseDto
    {
        public decimal RequestedLimit { get; set; }
        public string? Reason { get; set; }
    }
}
