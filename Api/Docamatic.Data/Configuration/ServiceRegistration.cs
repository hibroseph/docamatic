using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Docamatic.Data.Repositories;
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
        }
    }
}