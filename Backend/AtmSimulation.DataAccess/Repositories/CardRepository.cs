using AtmSimulation.DataAccess.Context;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AtmSimulation.DataAccess.Repositories
{
    public class CardRepository : ICardRepository
    {
        private readonly BankDbContext _context;
        public CardRepository(BankDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Card card)
        {
            await _context.Cards.AddAsync(card);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var card = await _context.Cards.FindAsync(id);
            if (card != null)
            {
                // Karta bağlı transaction'lardaki CardId'yi null yap
                var relatedTransactions = await _context.Transactions
                    .Where(t => t.CardId == id)
                    .ToListAsync();

                foreach (var transaction in relatedTransactions)
                {
                    transaction.CardId = null;
                }

                _context.Cards.Remove(card);
                await _context.SaveChangesAsync();
            }
                
        }

        public async Task<List<Card>> GetAllAsync()
        {
            return await _context.Cards
                .Include(c => c.Account)
                .ThenInclude(a => a!.Customer)
                .ToListAsync();
        }

        public async Task<Card?> GetByCardNumberAsync(string cardNumber)
        {
            return await _context.Cards
                .Include(x => x.Account)
                .FirstOrDefaultAsync(x => x.CardNumber == cardNumber);
        }

        public async Task<Card?> GetByIdAsync(int id)
        {
            return await _context.Cards
                .Include(x => x.Account)
                .ThenInclude(a => a!.Customer)
                .FirstOrDefaultAsync(x => x.Id == id);

        }

        public async Task UpdateAsync(Card card)
        {
            _context.Cards.Update(card);
            await _context.SaveChangesAsync();
        }
    }
}
