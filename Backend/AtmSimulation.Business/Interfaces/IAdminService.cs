using AtmSimulation.Application.DTOs;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Interfaces
{
    public interface IAdminService
    {
        Task<AdminLoginResponseDto> LoginAsync(AdminLoginDto dto);
        Task<List<Atm>> GetAllAtmsAsync();
        Task<Atm?> UpdateAtmStatusAsync(int atmId, UpdateAtmStatusDto dto);
        Task<bool> RefillAtmCashAsync(int atmId, decimal amount);
        Task<Atm> AddAtmAsync(string name, string location, int c200, int c100, int c50, int c20, int c10);
    }
}
