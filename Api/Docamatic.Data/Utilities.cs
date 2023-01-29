using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Docamatic.Data.Configuration;

namespace Docamatic.Data
{
    public static class Utilities
    {
        public static string CreatePostgresConnectionString(DatabaseConfiguration config) => $"Host={config.Host};Username={config.Username};Password={config.Password};Database={config.Database};";
    }
}