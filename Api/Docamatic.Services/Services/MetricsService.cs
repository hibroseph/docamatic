using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Docamatic.Data.Models;
using Docamatic.Data.Repositories;

namespace Docamatic.Services.Services
{
    public interface IMetricsService
    {
        Task AddMetricsAsync(List<BasicMetric> metrics);
    }

    public class MetricsService : IMetricsService
    {

        private readonly IMetricsRepository _metricsRepository;

        public MetricsService(IMetricsRepository metricsRepository)
        {
            _metricsRepository = metricsRepository;
        }
        public Task AddMetricsAsync(List<BasicMetric> metrics)
        {
            return _metricsRepository.AddMetricsAsync(metrics);
        }
    }
}