namespace AtmSimulation.Business.Results
{
    public class TransferResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal FromAccountBalanceAfter { get; set; }
    }
}
