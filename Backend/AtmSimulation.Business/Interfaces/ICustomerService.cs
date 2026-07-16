using AtmSimulation.Application.DTOs;
using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Business.Interfaces
{
    public interface ICustomerService
    {
        Task<Customer> CreateCustomerAsync(CreateCustomerDto dto);
        Task<List<Customer>> GetAllCustomersAsync();
        Task<Customer?> GetByIdAsync(int customerId);
        Task DeleteCustomerAsync(int customerId);
    }
}
