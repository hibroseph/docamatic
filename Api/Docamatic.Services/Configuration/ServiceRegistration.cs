using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Docamatic.Services.Services;

namespace Docamatic.Services.Configuration
{
    public static class ServiceRegistration
    {
        public static void AddServicesServiceRegistration(this IServiceCollection collection)
        {
            collection.AddSingleton<IMetricsService, MetricsService>();
        }
    }
}