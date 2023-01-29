using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Docamatic.Data.Configuration
{
    public class DatabaseConfiguration
    {
        public string Host { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string Database { get; set; }
    }
}