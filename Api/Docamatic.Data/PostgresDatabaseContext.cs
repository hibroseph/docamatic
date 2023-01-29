using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Docamatic.Data.Configuration;
using System.Data;
using Npgsql;
using Dapper;
using Docamatic.Data;

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
            _connectionString = Utilities.CreatePostgresConnectionString(config);
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