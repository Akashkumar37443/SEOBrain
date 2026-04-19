using Microsoft.AspNetCore.Mvc;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { status = "healthy", service = "SEOBrain.API", timestamp = DateTime.UtcNow });
        }
    }
}
