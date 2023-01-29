using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Models
{
    public class BasicMetricModel
    {
        public Guid User { get; set; }
        public string Event { get; set; }
        public string? Data { get; set; }
        public DateTimeOffset Date { get; set; }
    }
}