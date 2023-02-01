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
        public Task<int> ExecuteCommandAsync(string sql, object? parms = null);
        public Task<IEnumerable<T>> ExecuteQuery<T>(string sql, object? parms = null);
        public Task<IEnumerable<T>> ExecuteDefaultQuery<T>(string sql, object? parms = null);
        public Task<int> ExecuteDefaultCommandAsync(string sql, object? parms = null);
    }

    public class PostgresDatabaseContext : IDatabaseContext
    {
        private readonly string _connectionString;
        private readonly string _defaultDatabaseConnectionString;
        public PostgresDatabaseContext(DatabaseConfiguration config)
        {
            _connectionString = Utilities.CreatePostgresConnectionString(config);
            _defaultDatabaseConnectionString = _connectionString.Replace("docamatic", "postgres");
        }

        public async Task<int> ExecuteCommandAsync(string sql, object? parms = null)
        {
            using (var connection = new NpgsqlConnection(_connectionString))
            {
                return await connection.ExecuteAsync(sql, parms);
            }
        }

        public async Task<IEnumerable<T>> ExecuteQuery<T>(string sql, object? parms = null)
        {
            using (var connection = new NpgsqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                return await connection.QueryAsync<T>(sql, parms);
            }
        }

        public async Task<IEnumerable<T>> ExecuteDefaultQuery<T>(string sql, object? parms = null)
        {
            using (var connection = new NpgsqlConnection(_defaultDatabaseConnectionString))
            {
                await connection.OpenAsync();
                return await connection.QueryAsync<T>(sql, parms);
            }
        }

        public async Task<int> ExecuteDefaultCommandAsync(string sql, object? parms = null)
        {
            using (var connection = new NpgsqlConnection(_defaultDatabaseConnectionString))
            {
                return await connection.ExecuteAsync(sql, parms);
            }
        }

    }
}