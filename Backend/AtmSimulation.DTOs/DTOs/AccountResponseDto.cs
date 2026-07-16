namespace AtmSimulation.Application.DTOs
{
    public class AccountResponseDto
    {
        public int Id { get; set; }
        public string? AccountNumber { get; set; }
        public decimal Balance { get; set; }
    }
}
