using AtmSimulation.Application.DTOs;
using AtmSimulation.Business.Interfaces;
using AtmSimulation.DataAccess.Interfaces;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _customerRepo;
        public CustomerService(ICustomerRepository customerRepo)
        {
            _customerRepo = customerRepo;
        }
        public async Task<Customer> CreateCustomerAsync(CreateCustomerDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email))
                throw new Exception("Email adresi boş olamaz.");

            var existing = await _customerRepo.GetByEmailAsync(dto.Email);
            if (existing != null)
            {
                throw new Exception("Bu email adresi zaten kayıtlı.");
            }

            var customer = new Customer
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow
            };
            await _customerRepo.AddAsync(customer);
            return customer;
        }

        public async Task DeleteCustomerAsync(int customerId)
        {
            await _customerRepo.DeleteAsync(customerId);
        }

        public async Task<List<Customer>> GetAllCustomersAsync()
        {
            return await _customerRepo.GetAllAsync();
        }


        public async Task<Customer?> GetByIdAsync(int customerId)
        {
            var customer = await _customerRepo.GetByIdAsync(customerId);
            if (customer == null)
                throw new Exception("Müşteri bulunamadı.");
            return customer;
        }
    }
}
