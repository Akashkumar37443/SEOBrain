using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SEOBrain.API.DTOs;
using SEOBrain.API.Models;
using SEOBrain.API.Repositories;
using SEOBrain.API.Services;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnalysisController : ControllerBase
    {
        private readonly IContentAnalysisRepository _contentAnalysisRepository;
        private readonly IAIService _aiService;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<AnalysisController> _logger;

        public AnalysisController(
            IContentAnalysisRepository contentAnalysisRepository, 
            IAIService aiService,
            UserManager<User> userManager,
            ILogger<AnalysisController> logger)
        {
            _contentAnalysisRepository = contentAnalysisRepository;
            _aiService = aiService;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<AnalysisResultDto>> Analyze([FromBody] CreateAnalysisDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Text))
            {
                return BadRequest("Text is required");
            }

            // Get current user
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            // Check quota
            if (user.AnalysisUsedThisMonth >= user.MonthlyAnalysisQuota)
            {
                return StatusCode(429, new { 
                    message = "Monthly analysis quota exceeded. Upgrade your subscription for more analyses.",
                    quota = user.MonthlyAnalysisQuota,
                    used = user.AnalysisUsedThisMonth,
                    resetDate = user.QuotaResetDate
                });
            }

            // Reset quota if new month
            if (user.QuotaResetDate.HasValue && user.QuotaResetDate.Value < DateTime.UtcNow)
            {
                user.AnalysisUsedThisMonth = 0;
                user.QuotaResetDate = DateTime.UtcNow.AddMonths(1);
            }

            try
            {
                // 1) Save raw input first
                var analysis = new ContentAnalysis
                {
                    UserId = user.Id,
                    RawText = dto.Text
                };

                analysis = await _contentAnalysisRepository.CreateAsync(analysis);

                // 2) Call AI service
                var aiResult = await _aiService.AnalyzeAsync(dto.Text);

                // 3) Update record with AI results
                analysis.Score = aiResult.Score;
                analysis.Summary = aiResult.Summary;
                analysis.SuggestionsJson = JsonSerializer.Serialize(aiResult.Suggestions);

                analysis = await _contentAnalysisRepository.UpdateAsync(analysis);

                // 4) Increment user's analysis count
                user.AnalysisUsedThisMonth++;
                await _userManager.UpdateAsync(user);

                _logger.LogInformation(
                    "Analysis completed for user {UserId}. Score: {Score}. Remaining: {Remaining}/{Quota}",
                    user.Id,
                    aiResult.Score,
                    user.MonthlyAnalysisQuota - user.AnalysisUsedThisMonth,
                    user.MonthlyAnalysisQuota
                );

                // 5) Return to frontend
                return Ok(new AnalysisResultDto
                {
                    Id = analysis.Id,
                    Score = analysis.Score ?? 0,
                    Suggestions = aiResult.Suggestions,
                    Summary = analysis.Summary ?? string.Empty,
                    Keywords = aiResult.Keywords ?? new List<KeywordDto>(),
                    ReadabilityScore = aiResult.ReadabilityScore
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Analysis failed for user {UserId}", user.Id);
                return StatusCode(500, new { message = "Analysis failed. Please try again." });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AnalysisResultDto>> Get(Guid id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            var analysis = await _contentAnalysisRepository.GetByIdAsync(id);
            if (analysis == null) return NotFound();

            // Ensure user can only access their own analyses
            if (analysis.UserId != user.Id)
            {
                return Forbid();
            }

            var suggestions = new List<string>();
            var keywords = new List<KeywordDto>();

            if (!string.IsNullOrWhiteSpace(analysis.SuggestionsJson))
            {
                try
                {
                    suggestions = JsonSerializer.Deserialize<List<string>>(analysis.SuggestionsJson) ?? new List<string>();
                }
                catch
                {
                    suggestions = new List<string>();
                }
            }

            return Ok(new AnalysisResultDto
            {
                Id = analysis.Id,
                Score = analysis.Score ?? 0,
                Suggestions = suggestions,
                Summary = analysis.Summary ?? string.Empty,
                Keywords = keywords,
                ReadabilityScore = 0
            });
        }
    }
}
