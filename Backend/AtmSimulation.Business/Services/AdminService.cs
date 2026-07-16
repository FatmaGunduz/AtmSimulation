using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using AtmSimulation.DataAccess.Context;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Services
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _adminRepo;
        private readonly BankDbContext _context;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

        public AdminService(IAdminRepository adminRepo, BankDbContext context, Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            _adminRepo = adminRepo;
            _context = context;
            _configuration = configuration;
        }

        public async Task<List<Atm>> GetAllAtmsAsync()
        {
            return await _context.Atms.ToListAsync();
        }

        public async Task<AdminLoginResponseDto> LoginAsync(AdminLoginDto dto)
        {
            if (string.IsNullOrEmpty(dto.UserName))
                return new AdminLoginResponseDto { Success = false, Message = "Kullanıcı adı boş olamaz." };

            var admin = await _adminRepo.GetByUsernameAsync(dto.UserName);
            if (admin == null)
                return new AdminLoginResponseDto { Success = false, Message = "Admin bulunamadı." };

            if (string.IsNullOrEmpty(admin.PasswordHash))
                return new AdminLoginResponseDto { Success = false, Message = "Sistem hatası: Şifre kaydı bulunamadı." };

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, admin.PasswordHash);
            if (!isPasswordValid)
                return new AdminLoginResponseDto { Success = false, Message = "Şifre yanlış." };

            // JWT Üretimi
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key = System.Text.Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim("unique_name", admin.UserName ?? "admin"),
                    new System.Security.Claims.Claim("role", "Admin"),
                    new System.Security.Claims.Claim("AdminId", admin.Id.ToString())
                }),
                Expires = DateTime.UtcNow.AddHours(2),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
                    new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
                    Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return new AdminLoginResponseDto
            {
                Success = true,
                Message = "Giriş başarılı.",
                Token = tokenHandler.WriteToken(token),
                UserName = admin.UserName
            };
        }

        public async Task<bool> RefillAtmCashAsync(int atmId, decimal amount)
        {
            var atm = await _context.Atms.FindAsync(atmId);
            if (atm == null) return false;

            atm.CurrentCash += amount;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Atm?> UpdateAtmStatusAsync(int atmId, UpdateAtmStatusDto dto)
        {
            var atm = await _context.Atms.FindAsync(atmId);
            if (atm == null) return null;

            if (!Enum.IsDefined(typeof(AtmStatus), dto.Status))
            {
                throw new Exception("Geçersiz ATM durumu! Lütfen sadece 1 (Active), 2 (Maintenance) veya 3 (HardwareFault) kullanın.");
            }

            if (atm.Status != AtmStatus.Maintenance && dto.Status == AtmStatus.Maintenance)
            {
                atm.LastServiceDate = DateTime.UtcNow;
            }

            atm.Status = dto.Status;
            atm.Count200 = dto.Count200;
            atm.Count100 = dto.Count100;
            atm.Count50 = dto.Count50;
            atm.Count20 = dto.Count20;
            atm.Count10 = dto.Count10;
            atm.CurrentCash = (dto.Count200 * 200) + (dto.Count100 * 100) + (dto.Count50 * 50) + (dto.Count20 * 20) + (dto.Count10 * 10);
            await _context.SaveChangesAsync();
            return atm;
        }

        public async Task<Atm> AddAtmAsync(string name, string location, int c200, int c100, int c50, int c20, int c10)
        {
            var newAtm = new Atm
            {
                Name = name,
                Location = location,
                Count200 = c200,
                Count100 = c100,
                Count50 = c50,
                Count20 = c20,
                Count10 = c10,
                CurrentCash = (c200 * 200) + (c100 * 100) + (c50 * 50) + (c20 * 20) + (c10 * 10),
                Status = AtmStatus.Active,
                LastServiceDate = DateTime.UtcNow
            };

            _context.Atms.Add(newAtm);
            await _context.SaveChangesAsync();
            return newAtm;
        }
    }
}
