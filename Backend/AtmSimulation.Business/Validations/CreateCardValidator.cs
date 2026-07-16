using AtmSimulation.Application.DTOs;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Validations
{
    public class CreateCardValidator : AbstractValidator<CreateCardDto>
    {
        public CreateCardValidator()
        {
            RuleFor(x => x.AccountId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir hesap seçiniz.");

            RuleFor(x => x.CardNumber)
                .NotEmpty()
                .WithMessage("Kart numarası boş olamaz.")
                .Length(16)
                .WithMessage("Kart numarası 16 karakter olmalıdır.")
                .Matches("^[0-9]*")
                .WithMessage("Kart numarası sadece rakamlardan oluşmalıdır.");

            RuleFor(x => x.Pin)
                .NotEmpty()
                .WithMessage("PIN boş olamaz.")
                .Length(4)
                .WithMessage("PIN 4 haneli olmalıdır.")
                .Matches("^[0-9]*")
                .WithMessage("PIN sadece rakamlardan oluşmalıdır.")
;
            RuleFor(x => x.ExxpiryDate)
                .GreaterThan(DateTime.Today)
                .WithMessage("Son kullanma tarihi bugünden ileri olmalıdır.");
        }
    }
}
