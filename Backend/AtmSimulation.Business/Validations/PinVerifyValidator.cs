using AtmSimulation.Application.DTOs;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Validations
{
    public class PinVerifyValidator : AbstractValidator<PinVerifyRequestDto>
    {
        public PinVerifyValidator() 
        {
            RuleFor(x => x.CardNumber)
                .NotEmpty()
                .WithMessage("Kart numarası boş olamaz.")
                .Length(16)
                .WithMessage("Kart numarası 16 haneli olmalıdır.");
        
            RuleFor(x => x.Pin)
                .NotEmpty()
                .WithMessage("PIN boş olamaz.")
                .Length(4)
                .WithMessage("PIN 4 haneli olmalıdır.")
                .Matches("^[0-9]*$")
                .WithMessage("PIN sadece rakamlardan oluşmalıdır.");
        
        }
    }
}
