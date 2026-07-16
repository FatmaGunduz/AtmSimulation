using AtmSimulation.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AtmSimulation.DataAccess.Context
{
    public class BankDbContext : DbContext
    {
        public BankDbContext(DbContextOptions<BankDbContext> options) : base(options)
        { }
        public DbSet<Account> Accounts { get; set;}
        public DbSet<Card> Cards { get; set;}
        public DbSet<Transaction> Transactions { get; set;}
        public DbSet<AuditLog> AuditLogs { get; set;}
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Atm> Atms { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Card>()
                .HasOne(c => c.Account)
                .WithMany(a => a.Cards)
                .HasForeignKey(c => c.AccountId);

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Card)
                .WithMany()
                .HasForeignKey(t => t.CardId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId);
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Atm)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AtmId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Account>()
                .Property(a => a.Balance)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Card>()
                .Property(c => c.CreditLimit)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Card>()
                .Property(c => c.CreditDebt)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Card>()
                .Property(c => c.RequestedCreditLimit)
                .HasColumnType("decimal(18,2)");

            // Concurrency token mapping
            modelBuilder.Entity<Account>()
                .Property(a => a.RowVersion)
                .IsRowVersion();

            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Transaction>()
                .Property(t => t.BalanceBefore)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Transaction>()
                .Property(t => t.BalanceAfter)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Atm>()
                .Property(a => a.CurrentCash)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Account>()
                .HasOne(a => a.Customer)
                .WithMany(c => c.Accounts)
                .HasForeignKey(a => a.CustomerId);
        }

        public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            // Audit edilecek girdileri kaydetmeden ÖNCE yakala ve state'lerini sakla
            var auditEntries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added
                         || e.State == EntityState.Modified
                         || e.State == EntityState.Deleted)
                .Select(e => new
                {
                    TableName = e.Entity.GetType().Name,
                    Action = e.State.ToString(),
                    // Deleted için CurrentValues yok, Modified/Added için var
                    NewValueSnapshot = e.State != EntityState.Deleted
                        ? JsonSerializer.Serialize(e.CurrentValues.ToObject())
                        : null,
                    OldValueSnapshot = e.State != EntityState.Added
                        ? JsonSerializer.Serialize(e.OriginalValues.ToObject())
                        : null
                })
                .ToList();

            // 1. Asıl veriyi kaydet
            var result = await base.SaveChangesAsync(ct);

            // 2. Audit loglarını oluştur ve tek seferde kaydet (override'a düşmemek için base kullan)
            if (auditEntries.Any())
            {
                foreach (var entry in auditEntries)
                {
                    AuditLogs.Add(new AuditLog
                    {
                        TableName = entry.TableName,
                        Action = entry.Action,
                        Timestamp = DateTime.UtcNow,
                        NewValue = entry.NewValueSnapshot,
                        OldValue = entry.OldValueSnapshot
                    });
                }
                await base.SaveChangesAsync(ct);
            }

            return result;
        }
        
    }
}
