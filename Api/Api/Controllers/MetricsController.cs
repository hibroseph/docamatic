using Microsoft.AspNetCore.Mvc;
using Api.Models;
using Docamatic.Services;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[Controller]")]
public class MetricsController : ControllerBase
{
    private readonly IMetricsService _metricsService;

    public MetricsController(IMetricsService metricsService)
    {
        _metricsService = metricsService;
    }

    [HttpPost]
    public async Task<IActionResult> SaveMetrics([FromBody] List<BasicMetricModel> metrics)
    {
        System.Console.WriteLine("Got metrics");
        await _metricsService.AddMetricsAsync();
        return Ok("Metrics");
    }
}
