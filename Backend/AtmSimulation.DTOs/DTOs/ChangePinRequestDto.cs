using System.ComponentModel.DataAnnotations;

namespace AtmSimulation.Application.DTOs
{
    public class ChangePinRequestDto
    {
        [Required(ErrorMessage = "Mevcut şifre (OldPin) zorunludur.")]
        [StringLength(4, MinimumLength = 4, ErrorMessage = "Şifre 4 haneli olmalıdır.")]
        public string OldPin { get; set; } = string.Empty;

        [Required(ErrorMessage = "Yeni şifre (NewPin) zorunludur.")]
        [StringLength(4, MinimumLength = 4, ErrorMessage = "Yeni şifre 4 haneli olmalıdır.")]
        public string NewPin { get; set; } = string.Empty;
    }
}
