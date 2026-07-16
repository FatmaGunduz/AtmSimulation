using AtmSimulation.Application.DTOs;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Validations
{
    public class UnblockCardValidator : AbstractValidator<UnblockCardDto>
    {
        public UnblockCardValidator() 
        {
            RuleFor(x => x.CardId)
                .GreaterThan(0)
                .WithMessage("Geçerli bir kart seçiniz.");
        }
    }
}
