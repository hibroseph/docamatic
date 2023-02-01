using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Docamatic.Data.Repositories;
using FluentMigrator;
using FluentMigrator.Postgres;
using FluentMigrator.Runner;
using Npgsql;
using System.Reflection;
using Dapper;

namespace Docamatic.Data.Configuration
{
    public static class ServiceRegistration
    {
        public static async Task AddDataServiceRegistration(this IServiceCollection collection, DatabaseConfiguration dbConfig)
        {
            System.Console.WriteLine("Configuring database configuration");
            collection.AddSingleton<DatabaseConfiguration>(dbConfig);
            collection.AddSingleton<IDatabaseContext, PostgresDatabaseContext>();
            collection.AddSingleton<IMetricsRepository, MetricsRepository>();

            AddMigrationService(collection, dbConfig);
            await MigrateDatabaseAsync(collection);
        }

        private static async Task VerifyDatabaseExistsAsync(IServiceProvider provider)
        {
            var dbContext = provider.GetRequiredService<IDatabaseContext>();

            var dbs = await dbContext.ExecuteDefaultQuery<string>("SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('docamatic');");

            if (dbs.Count() == 0)
            {
                System.Console.WriteLine("docamatic database does not exists. Creating");
                await dbContext.ExecuteDefaultCommandAsync("CREATE DATABASE docamatic");
                System.Console.WriteLine("docamatic database created. Continuing with starting the app");
            }
        }

        private static async Task MigrateDatabaseAsync(IServiceCollection collection)
        {
            System.Console.WriteLine("Migrating database");

            using (var serviceProvider = collection.BuildServiceProvider())
            {

                await VerifyDatabaseExistsAsync(serviceProvider);
                var runner = serviceProvider.GetRequiredService<IMigrationRunner>();
                System.Console.WriteLine("Migrating up");
                // Make sure database is created

                runner.MigrateUp();
            }
        }
        private static void AddMigrationService(IServiceCollection collection, DatabaseConfiguration dbConfig)
        {
            System.Console.WriteLine("Adding migration service");
            //EnsureDatabaseIsCreated(dbConfig);
            collection.AddFluentMigratorCore()
            .ConfigureRunner(rb =>
                rb.AddPostgres()
                .WithGlobalConnectionString(Utilities.CreatePostgresConnectionString(dbConfig))
                .ScanIn(Assembly.GetExecutingAssembly()).For.Migrations()
            )
            .AddLogging(p => p.AddFluentMigratorConsole());
        }
    }
}