using AtmSimulation.DataAccess.Context;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.DataAccess.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly BankDbContext _context;
        public AdminRepository (BankDbContext context)
        {

            _context = context;
        }

        public async Task AddAsync(Admin admin)
        {
            await _context.Admins.AddAsync(admin);
            await _context.SaveChangesAsync();
        }

        public async Task<Admin?> GetByIdAsync(int id)
        {
            return await _context.Admins.FindAsync(id);
        }

        public async Task<Admin?> GetByUsernameAsync(string username)
        {
            return await _context.Admins.FirstOrDefaultAsync(a => a.UserName == username);
        }
    }
}
