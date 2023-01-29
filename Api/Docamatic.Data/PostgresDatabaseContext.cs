using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Docamatic.Data.Configuration;
using System.Data;
using Npgsql;
using Dapper;

namespace Docamatic.Data
{
    public interface IDatabaseContext
    {
        public Task<int> ExecuteCommandAsync(string sql, object? parms);
    }

    public class PostgresDatabaseContext : IDatabaseContext
    {
        private readonly string _connectionString;
        public PostgresDatabaseContext(DatabaseConfiguration config)
        {
            _connectionString = $"Host={config.Host};Username={config.Username};Password={config.Password};Database={config.Database};";
        }

        public async Task<int> ExecuteCommandAsync(string sql, object? parms)
        {
            using (var connection = new NpgsqlConnection(_connectionString))
            {
                return await connection.ExecuteAsync(sql, parms);
            }
        }
    }
}