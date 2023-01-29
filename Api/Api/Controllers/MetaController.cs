using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MetaController : ControllerBase
    {
        private ILogger<MetaController> _logger { get; set; }

        public MetaController(ILogger<MetaController> logger) => _logger = logger;

        [HttpGet("health")]
        public IActionResult Health()
        {
            _logger.LogDebug("Hit Health endpoint");
            return Ok("Health: Alive");
        }

        [HttpGet("version")]
        public IActionResult Version()
        {
            return Ok(GetType().Assembly.GetName().Version.ToString());
        }
    }
}
