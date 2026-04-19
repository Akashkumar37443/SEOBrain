using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SEOBrain.API.Data;
using SEOBrain.API.Models;
using Microsoft.EntityFrameworkCore;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/feedback")]
    [Authorize]
    public class FeedbackController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<FeedbackController> _logger;

        public FeedbackController(
            ApplicationDbContext context,
            UserManager<User> userManager,
            ILogger<FeedbackController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpPost("analysis/{analysisId}")]
        public async Task<IActionResult> SubmitFeedback(
            Guid analysisId,
            [FromBody] FeedbackRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var analysis = await _context.ContentAnalyses.FindAsync(analysisId);
            if (analysis == null) return NotFound();

            // Verify ownership
            if (analysis.UserId != user.Id) return Forbid();

            var feedback = new AnalysisFeedback
            {
                Id = Guid.NewGuid(),
                ContentAnalysisId = analysisId,
                UserId = user.Id,
                Rating = request.Rating, // 1-5 stars
                WasHelpful = request.WasHelpful,
                AccuracyScore = request.AccuracyScore, // 1-10
                Comments = request.Comments,
                SuggestedImprovements = request.SuggestedImprovements,
                KeywordsMissing = string.Join(",", request.MissingKeywords ?? new List<string>()),
                IncorrectSuggestions = string.Join(",", request.IncorrectSuggestions ?? new List<string>()),
                CreatedAt = DateTime.UtcNow
            };

            _context.AnalysisFeedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Feedback submitted for analysis {AnalysisId} by user {UserId}. Rating: {Rating}",
                analysisId, user.Id, request.Rating);

            return Ok(new { message = "Feedback recorded. Thank you!" });
        }

        [HttpGet("training-data")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetTrainingData([FromQuery] int minRating = 4)
        {
            // Get high-quality feedback for training
            var feedbackData = await _context.AnalysisFeedbacks
                .Where(f => f.Rating >= minRating && f.AccuracyScore >= 7)
                .Take(1000)
                .ToListAsync();

            // Get related analyses
            var analysisIds = feedbackData.Select(f => f.ContentAnalysisId).ToList();
            var analyses = await _context.ContentAnalyses
                .Where(a => analysisIds.Contains(a.Id))
                .ToDictionaryAsync(a => a.Id);

            var trainingData = feedbackData
                .Where(f => analyses.ContainsKey(f.ContentAnalysisId))
                .Select(f => {
                    var analysis = analyses[f.ContentAnalysisId];
                    return new TrainingExample
                    {
                        Messages = new List<Message>
                        {
                            new() { Role = "system", Content = "You are an expert SEO analyst. Provide accurate, actionable SEO analysis." },
                            new() { Role = "user", Content = $"Analyze this content for SEO:\n\n{analysis.RawText}" },
                            new() { Role = "assistant", Content = System.Text.Json.JsonSerializer.Serialize(new
                            {
                                score = analysis.Score,
                                summary = analysis.Summary,
                                suggestions = System.Text.Json.JsonSerializer.Deserialize<List<string>>(analysis.SuggestionsJson ?? "[]")
                            }) }
                        }
                    };
                });

            return Ok(trainingData);
        }

        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetFeedbackStats()
        {
            var stats = await _context.AnalysisFeedbacks
                .GroupBy(f => 1)
                .Select(g => new
                {
                    TotalFeedback = g.Count(),
                    AverageRating = g.Average(f => f.Rating),
                    AverageAccuracy = g.Average(f => f.AccuracyScore),
                    HelpfulCount = g.Count(f => f.WasHelpful),
                    NotHelpfulCount = g.Count(f => !f.WasHelpful)
                })
                .FirstOrDefaultAsync();

            return Ok(stats ?? new { TotalFeedback = 0, AverageRating = 0.0, AverageAccuracy = 0.0, HelpfulCount = 0, NotHelpfulCount = 0 });
        }
    }

    public class FeedbackRequest
    {
        public int Rating { get; set; } // 1-5
        public bool WasHelpful { get; set; }
        public int AccuracyScore { get; set; } // 1-10
        public string? Comments { get; set; }
        public string? SuggestedImprovements { get; set; }
        public List<string>? MissingKeywords { get; set; }
        public List<string>? IncorrectSuggestions { get; set; }
    }

    public class AnalysisFeedback
    {
        public Guid Id { get; set; }
        public Guid ContentAnalysisId { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; }
        public bool WasHelpful { get; set; }
        public int AccuracyScore { get; set; }
        public string? Comments { get; set; }
        public string? SuggestedImprovements { get; set; }
        public string? KeywordsMissing { get; set; }
        public string? IncorrectSuggestions { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TrainingExample
    {
        public List<Message> Messages { get; set; } = new();
    }

    public class Message
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
