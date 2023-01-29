using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Docamatic.Data;

namespace Docamatic.Services
{
    public interface IMetricsService
    {
        Task AddMetricsAsync();
    }

    public class MetricsService : IMetricsService
    {

        private readonly IMetricsRepository _metricsRepository;

        public MetricsService(IMetricsRepository metricsRepository)
        {
            _metricsRepository = metricsRepository;
        }
        public Task AddMetricsAsync()
        {
            return _metricsRepository.AddMetricsAsync();
        }
    }
}