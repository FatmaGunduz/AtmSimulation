namespace AtmSimulation.Application.DTOs
{
    public class TransferRequestDto
    {
        public int FromAccountId { get; set; }
        public int ToAccountId { get; set; }
        public string? ToIban { get; set; }
        public decimal Amount { get; set; }
        public int AtmId { get; set; }
    }
}
