using AtmSimulation.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AtmSimulation.Application.DTOs
{
    public class UpdateAtmStatusDto
    {
        public AtmStatus Status { get; set; }
        public int Count200 { get; set; }
        public int Count100 { get; set; }
        public int Count50 { get; set; }
        public int Count20 { get; set; }
        public int Count10 { get; set; }
    }
}
