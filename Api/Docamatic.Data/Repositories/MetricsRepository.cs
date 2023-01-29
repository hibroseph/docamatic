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
        private IDatabaseContext _dbContext;

        private string _insertMetricsSql = @$"INSERT INTO basic_metrics (date_occurred, event, data, person) VALUES ( 
                                                @{nameof(BasicMetric.Date)}, 
                                                @{nameof(BasicMetric.Event)},
                                                @{nameof(BasicMetric.Data)},
                                                @{nameof(BasicMetric.Person)})";
        public MetricsRepository(IDatabaseContext databaseContext)
        {
            _dbContext = databaseContext;
        }

        public async Task AddMetricsAsync(List<BasicMetric> metrics)
        {
            System.Console.WriteLine($"Adding {metrics.Count} metrics to db: new");

            await _dbContext.ExecuteCommandAsync(_insertMetricsSql, metrics);
        }
    }
}