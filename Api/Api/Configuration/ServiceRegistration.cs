using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Configuration
{
    public static class ServiceRegistration
    {
        public static void AddApiServiceRegistration(this IServiceCollection collection, IConfiguration config)
        {
            System.Console.WriteLine("Adding Api Service Registration");
        }
    }
}