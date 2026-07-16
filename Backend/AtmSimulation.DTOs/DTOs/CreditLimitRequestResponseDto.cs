using AtmSimulation.Entities;

namespace AtmSimulation.Application.DTOs
{
    public class CreditLimitRequestResponseDto
    {
        public int CardId { get; set; }
        public string? CardNumber { get; set; }
        public decimal CurrentCreditLimit { get; set; }
        public decimal? RequestedCreditLimit { get; set; }
        public LimitRequestStatus? Status { get; set; }
        public string? StatusText => Status switch
        {
            LimitRequestStatus.Pending  => "Beklemede",
            LimitRequestStatus.Approved => "Onaylandı",
            LimitRequestStatus.Rejected => "Reddedildi",
            _ => "Bilinmiyor"
        };
        public DateTime? RequestDate { get; set; }
        public string? Reason { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? ApprovedDate { get; set; }
        // Müşteri bilgileri (admin görünümü için)
        public string? CustomerFullName { get; set; }
        public string? CustomerEmail { get; set; }
    }
}
