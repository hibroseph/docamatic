using Microsoft.AspNetCore.Mvc;
using Api.Models;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[Controller]")]
public class MetricsController : ControllerBase
{

    [HttpPost]
    public IActionResult SaveMetrics([FromBody] List<BasicMetricModel> metrics)
    {
        System.Console.WriteLine("Got metrics");
        return Ok("Metrics");
    }
}
