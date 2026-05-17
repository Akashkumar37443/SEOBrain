using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEOBrain.API.DTOs;
using SEOBrain.API.Services;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/aistudio")]
    [Authorize]
    public class AIStudioController : ControllerBase
    {
        private readonly IAIService _aiService;
        private readonly ILogger<AIStudioController> _logger;

        public AIStudioController(IAIService aiService, ILogger<AIStudioController> logger)
        {
            _aiService = aiService;
            _logger = logger;
        }

        [HttpPost("meta-schema")]
        public async Task<ActionResult<AiMetaSchemaResponseDto>> GenerateMetaSchema([FromBody] AiMetaSchemaRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Content) || string.IsNullOrWhiteSpace(request.PrimaryKeyword))
            {
                return BadRequest("Content and PrimaryKeyword are required.");
            }

            try
            {
                var result = await _aiService.GenerateMetaSchemaAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate meta schema.");
                return StatusCode(500, new { message = "Failed to generate meta schema." });
            }
        }

        [HttpPost("keyword-cluster")]
        public async Task<ActionResult<AiKeywordClusterResponseDto>> GenerateKeywordClusters([FromBody] AiKeywordClusterRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Topic))
            {
                return BadRequest("Topic is required.");
            }

            try
            {
                var result = await _aiService.GenerateKeywordClustersAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate keyword clusters.");
                return StatusCode(500, new { message = "Failed to generate keyword clusters." });
            }
        }
    }
}
