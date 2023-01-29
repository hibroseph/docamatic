using Microsoft.AspNetCore.Mvc;
using Api.Models;
using Docamatic.Services.Services;
using DataModels = Docamatic.Data.Models;
using AutoMapper;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[Controller]")]
public class MetricsController : ControllerBase
{
    private readonly IMetricsService _metricsService;
    private readonly IMapper _mapper;

    public MetricsController(IMetricsService metricsService, IMapper mapper)
    {
        _metricsService = metricsService;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> SaveMetrics([FromBody] List<BasicMetric> metrics)
    {
        System.Console.WriteLine("Got metrics");
        await _metricsService.AddMetricsAsync(_mapper.Map<List<BasicMetric>, List<DataModels.BasicMetric>>(metrics));
        return Ok("Metrics");
    }
}
