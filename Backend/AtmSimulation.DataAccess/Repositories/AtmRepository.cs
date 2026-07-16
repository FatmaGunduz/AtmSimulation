using AtmSimulation.DataAccess.Context;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.DataAccess.Repositories
{
    public class AtmRepository : IAtmRepository
    {
        private readonly BankDbContext _context;
        public AtmRepository(BankDbContext context)
        {
            _context = context;
        }
        public async Task<Atm?> GetByIdAsync(int id) 
            => await _context.Atms.FindAsync(id);
       

        public async Task UpdateAsync(Atm atm)
        {
            _context.Atms.Update(atm);
            await _context.SaveChangesAsync();
        }
    }
}
