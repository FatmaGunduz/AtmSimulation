using AtmSimulation.Application.DTOs;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Validations
{
    public class CreateAccountValidator : AbstractValidator<CreateAccountDto>
    {
        public CreateAccountValidator() 
        {
            RuleFor(x => x.OwnerName)
                .NotEmpty()
                .WithMessage("Hesap sahibi ismi boş olamaz.")
                .MinimumLength(3)
                .WithMessage("İsim en az 3 karakter olmalıdır.") ;

            RuleFor(x => x.InitialBalance)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Başlangıç bakiyesi negatif olamaz.");
        }
    }
}
