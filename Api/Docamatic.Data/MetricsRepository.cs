using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Docamatic.Data
{
    public interface IMetricsRepository
    {
        Task AddMetricsAsync();
    }
    public class MetricsRepository : IMetricsRepository
    {
        public Task AddMetricsAsync()
        {
            System.Console.WriteLine("Adding metrics from data layer");

            return Task.CompletedTask;
        }
    }
}