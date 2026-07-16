using AtmSimulation.Application.DTOs;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Validations
{
    public class WithdrawValidator : AbstractValidator<WithdrawRequestDto>
    {
        public WithdrawValidator()
        {
            RuleFor(x => x.AccountId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Geçerli bir hesap seçiniz.");

            RuleFor(x => x.AtmId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir ATM seçiniz.");

            RuleFor(x => x.Amount)
                .GreaterThan(0)
                .WithMessage("Tutar 0'dan büyük olmalıdır.")
                .LessThanOrEqualTo(50000)
                .WithMessage("Tek seferde en fazla 50.000 TL çekilebilir.")
                .Must(amount => amount % 10 == 0)
                .WithMessage("Çekilecek tutar 10 TL ve katları olmalıdır (10, 20, 50, 100, 200...).");
        }

    }
}
