using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.DataAccess.Interfaces
{
    public interface IAtmRepository
    {
        Task<Atm?> GetByIdAsync(int id);
        Task UpdateAsync(Atm atm);
    }
}
