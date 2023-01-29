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
        public static void AddDataServiceRegistration(this IServiceCollection collection, DatabaseConfiguration dbConfig)
        {
            System.Console.WriteLine("Configuring database configuration");
            collection.AddSingleton<DatabaseConfiguration>(dbConfig);
            collection.AddSingleton<IDatabaseContext, PostgresDatabaseContext>();
            collection.AddSingleton<IMetricsRepository, MetricsRepository>();

            AddMigrationService(collection, dbConfig);
            MigrateDatabase(collection);
        }

        private static void MigrateDatabase(IServiceCollection collection)
        {
            System.Console.WriteLine("Migrating database");

            using (var serviceProvider = collection.BuildServiceProvider())
            {
                var runner = serviceProvider.GetRequiredService<IMigrationRunner>();

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