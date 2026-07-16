using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.DataAccess.Interfaces
{
    public interface ICardRepository
    {
        Task<Card?> GetByCardNumberAsync(string cardNumber);
        Task<Card?> GetByIdAsync(int id);
        Task<List<Card>> GetAllAsync();
        Task AddAsync(Card card);
        Task UpdateAsync(Card card);
        Task DeleteAsync(int id);
    }
}
