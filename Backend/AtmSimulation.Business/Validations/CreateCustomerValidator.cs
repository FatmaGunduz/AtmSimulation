using AtmSimulation.Application.DTOs;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Validations
{
    public class CreateCustomerValidator : AbstractValidator<CreateCustomerDto>
    {
        public CreateCustomerValidator() 
        {
            RuleFor(x => x.FullName)
                .NotEmpty()
                .WithMessage("İsim boş olamaz")
                .MinimumLength(3)
                .WithMessage("İsim en az 3 karakter olmalıdır.")
                .MaximumLength(50)
                .WithMessage("İsim en fazla 50 karakter olabilir.");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email boş olamaz")
                .EmailAddress()
                .WithMessage("Geçerli bir mail adresi giriniz.");

            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Şifre boş olamaz")
                .MinimumLength(6)
                .WithMessage("Şifre en az 6 karakter olmalıdır.");
        }
    }
}
