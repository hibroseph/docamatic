using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Docamatic.Data.Models;

namespace Docamatic.Data.Repositories
{
    public interface IMetricsRepository
    {
        Task AddMetricsAsync(List<BasicMetric> metrics);
    }
    public class MetricsRepository : IMetricsRepository
    {
        public Task AddMetricsAsync(List<BasicMetric> metrics)
        {
            System.Console.WriteLine($"Adding {metrics.Count} metrics to db");

            return Task.CompletedTask;
        }
    }
}