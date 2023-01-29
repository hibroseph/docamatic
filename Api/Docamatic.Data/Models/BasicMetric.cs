using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Docamatic.Data.Models
{
    public class BasicMetric
    {
        public Guid Person { get; set; }
        public string Event { get; set; }
        public string? Data { get; set; }
        public DateTimeOffset Date { get; set; }
    }
}