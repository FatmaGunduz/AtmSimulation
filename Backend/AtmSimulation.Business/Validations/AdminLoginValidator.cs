using AtmSimulation.Application.DTOs;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Validations
{
    public class AdminLoginValidator: AbstractValidator<AdminLoginDto>
    {
        public AdminLoginValidator() 
        {
            RuleFor(x => x.UserName)
            .NotEmpty()
            .WithMessage("Kullanıcı adı boş olamaz.")
            .MinimumLength(3)
            .WithMessage("Kullanıcı adı en az 3 karakter olabilir.");

            RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Şifre boş olamaz.")
            .MinimumLength(6)
            .WithMessage("Şifre en az 6 karakter olmalıdır.");
        }
    }
}
