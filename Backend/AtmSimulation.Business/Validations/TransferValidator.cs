using AtmSimulation.Application.DTOs;
using FluentValidation;

namespace AtmSimulation.Business.Validations
{
    public class TransferValidator : AbstractValidator<TransferRequestDto>
    {
        public TransferValidator()
        {
            RuleFor(x => x.FromAccountId)
                .GreaterThan(0)
                .WithMessage("Gönderen hesap seçiniz.");

            RuleFor(x => x.Amount)
                .GreaterThan(0)
                .WithMessage("Tutar 0'dan büyük olmalıdır.")
                .LessThanOrEqualTo(50000)
                .WithMessage("Tek seferde en fazla 50.000 TL gönderilebilir.");

            RuleFor(x => x.AtmId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Geçerli bir ATM seçiniz.");

            RuleFor(x => x)
                .Must(x => (x.ToAccountId > 0) || !string.IsNullOrWhiteSpace(x.ToIban))
                .WithMessage("Alıcı hesabı veya IBAN bilgisi girilmelidir.");
        }
    }
}
