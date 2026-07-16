using AtmSimulation.Entities;

namespace AtmSimulation.Application.DTOs
{
    public class CustomerAccountsResponseDto
    {
        public List<AccountResponseDto> Accounts { get; set; } = new();
        public CardResponseDto Card { get; set; } = new();
    }

    public class CardResponseDto
    {
        public int Id { get; set; }
        public string? CardNumber { get; set; }
        public decimal CreditLimit { get; set; }
        public decimal CreditDebt { get; set; }
        public bool IsCreditCard { get; set; }
        public decimal? RequestedCreditLimit { get; set; }
        public LimitRequestStatus? LimitRequestStatus { get; set; }
        public string? LimitRequestStatusText => LimitRequestStatus switch
        {
            AtmSimulation.Entities.LimitRequestStatus.Pending => "Beklemede",
            AtmSimulation.Entities.LimitRequestStatus.Approved => "Onaylandı",
            AtmSimulation.Entities.LimitRequestStatus.Rejected => "Reddedildi",
            _ => null
        };
        public DateTime? LimitRequestDate { get; set; }
        public string? LimitRequestReason { get; set; }
        public string? LimitRejectionReason { get; set; }
    }
}
