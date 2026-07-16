namespace AtmSimulation.Application.DTOs
{
    public class ApproveCreditLimitIncreaseDto
    {
        public int CardId { get; set; }
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }
}
