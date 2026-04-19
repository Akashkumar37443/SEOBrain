using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEOBrain.API.Data;
using SEOBrain.API.Models;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(
            ApplicationDbContext context,
            UserManager<User> userManager,
            ILogger<AnalyticsController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var now = DateTime.UtcNow;
            var thirtyDaysAgo = now.AddDays(-30);

            var analyses = await _context.ContentAnalyses
                .Where(a => a.UserId == user.Id && a.CreatedAt >= thirtyDaysAgo)
                .ToListAsync();

            var dashboard = new AnalyticsDashboard
            {
                TotalAnalyses = analyses.Count,
                AverageScore = analyses.Any() ? (int)analyses.Average(a => a.Score ?? 0) : 0,
                AnalysesThisMonth = analyses.Count(a => a.CreatedAt >= now.AddDays(-30)),
                RemainingQuota = user.MonthlyAnalysisQuota - user.AnalysisUsedThisMonth,
                MonthlyQuota = user.MonthlyAnalysisQuota,
                SubscriptionTier = user.SubscriptionTier,
                UsageTrend = CalculateUsageTrend(analyses),
                ScoreDistribution = CalculateScoreDistribution(analyses),
                TopKeywords = await GetTopKeywords(user.Id),
                RecentActivity = analyses
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(10)
                    .Select(a => new ActivityItem
                    {
                        Id = a.Id,
                        Score = a.Score ?? 0,
                        CreatedAt = a.CreatedAt,
                        Summary = a.Summary ?? "Content analyzed",
                        WordCount = a.RawText?.Split().Length ?? 0
                    })
                    .ToList()
            };

            return Ok(dashboard);
        }

        [HttpGet("trends")]
        public async Task<IActionResult> GetTrends([FromQuery] int days = 30)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var startDate = DateTime.UtcNow.AddDays(-days);
            
            var dailyStats = await _context.ContentAnalyses
                .Where(a => a.UserId == user.Id && a.CreatedAt >= startDate)
                .GroupBy(a => a.CreatedAt.Date)
                .Select(g => new DailyTrend
                {
                    Date = g.Key,
                    Count = g.Count(),
                    AverageScore = (int)g.Average(a => a.Score ?? 0)
                })
                .OrderBy(d => d.Date)
                .ToListAsync();

            return Ok(dailyStats);
        }

        [HttpGet("insights")]
        public async Task<IActionResult> GetInsights()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var analyses = await _context.ContentAnalyses
                .Where(a => a.UserId == user.Id)
                .OrderByDescending(a => a.CreatedAt)
                .Take(50)
                .ToListAsync();

            if (!analyses.Any())
                return Ok(new { message = "Not enough data for insights yet." });

            var insights = new ContentInsights
            {
                AverageContentLength = (int)analyses.Average(a => a.RawText?.Length ?? 0),
                BestPerformingScore = analyses.Max(a => a.Score ?? 0),
                CommonSuggestions = ExtractCommonSuggestions(analyses),
                ImprovementAreas = IdentifyImprovementAreas(analyses),
                ContentVelocity = analyses.Count() / 30.0 // per day average
            };

            return Ok(insights);
        }

        [HttpGet("compare")]
        public async Task<IActionResult> ComparePeriods([FromQuery] int days1 = 30, [FromQuery] int days2 = 30)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var end1 = DateTime.UtcNow;
            var start1 = end1.AddDays(-days1);
            var end2 = start1;
            var start2 = end2.AddDays(-days2);

            var period1 = await GetPeriodStats(user.Id, start1, end1);
            var period2 = await GetPeriodStats(user.Id, start2, end2);

            var comparison = new PeriodComparison
            {
                Period1 = period1,
                Period2 = period2,
                AnalysisCountChange = CalculateChange(period1.AnalysisCount, period2.AnalysisCount),
                AverageScoreChange = CalculateChange(period1.AverageScore, period2.AverageScore),
                ContentVolumeChange = CalculateChange(period1.TotalWords, period2.TotalWords)
            };

            return Ok(comparison);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/global")]
        public async Task<IActionResult> GetGlobalStats()
        {
            var totalUsers = await _userManager.Users.CountAsync();
            var totalAnalyses = await _context.ContentAnalyses.CountAsync();
            var analysesToday = await _context.ContentAnalyses.CountAsync(a => a.CreatedAt.Date == DateTime.UtcNow.Date);
            
            var tierDistribution = await _userManager.Users
                .GroupBy(u => u.SubscriptionTier)
                .Select(g => new { Tier = g.Key, Count = g.Count() })
                .ToListAsync();

            var globalStats = new GlobalStats
            {
                TotalUsers = totalUsers,
                TotalAnalyses = totalAnalyses,
                AnalysesToday = analysesToday,
                TierDistribution = tierDistribution.ToDictionary(t => t.Tier, t => t.Count),
                AverageAnalysesPerUser = totalUsers > 0 ? (double)totalAnalyses / totalUsers : 0
            };

            return Ok(globalStats);
        }

        private List<UsagePoint> CalculateUsageTrend(List<ContentAnalysis> analyses)
        {
            return analyses
                .GroupBy(a => a.CreatedAt.ToString("yyyy-MM-dd"))
                .Select(g => new UsagePoint { Date = g.Key, Count = g.Count() })
                .OrderBy(u => u.Date)
                .ToList();
        }

        private ScoreDistribution CalculateScoreDistribution(List<ContentAnalysis> analyses)
        {
            var scores = analyses.Select(a => a.Score ?? 0).ToList();
            return new ScoreDistribution
            {
                Excellent = scores.Count(s => s >= 80),
                Good = scores.Count(s => s >= 60 && s < 80),
                Average = scores.Count(s => s >= 40 && s < 60),
                Poor = scores.Count(s => s < 40)
            };
        }

        private async Task<List<TopKeyword>> GetTopKeywords(Guid userId)
        {
            // This is a simplified version - in production, you'd parse the stored keywords
            var recentAnalyses = await _context.ContentAnalyses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(20)
                .ToListAsync();

            // Extract keywords from content (simplified)
            var wordFrequency = new Dictionary<string, int>();
            foreach (var analysis in recentAnalyses)
            {
                if (string.IsNullOrEmpty(analysis.RawText)) continue;
                
                var words = analysis.RawText.ToLower()
                    .Split(new[] { ' ', '.', ',', '!', '?' }, StringSplitOptions.RemoveEmptyEntries)
                    .Where(w => w.Length > 4)
                    .GroupBy(w => w)
                    .Select(g => new { Word = g.Key, Count = g.Count() });

                foreach (var word in words)
                {
                    if (wordFrequency.ContainsKey(word.Word))
                        wordFrequency[word.Word] += word.Count;
                    else
                        wordFrequency[word.Word] = word.Count;
                }
            }

            return wordFrequency
                .OrderByDescending(kvp => kvp.Value)
                .Take(10)
                .Select((kvp, index) => new TopKeyword { Term = kvp.Key, Occurrences = kvp.Value, Rank = index + 1 })
                .ToList();
        }

        private List<string> ExtractCommonSuggestions(List<ContentAnalysis> analyses)
        {
            // Parse all suggestions and find most common
            var allSuggestions = analyses
                .Where(a => !string.IsNullOrEmpty(a.SuggestionsJson))
                .SelectMany(a => System.Text.Json.JsonSerializer.Deserialize<List<string>>(a.SuggestionsJson!) ?? new List<string>())
                .GroupBy(s => s)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => g.Key)
                .ToList();

            return allSuggestions;
        }

        private List<string> IdentifyImprovementAreas(List<ContentAnalysis> analyses)
        {
            var areas = new List<string>();
            var avgScore = analyses.Average(a => a.Score ?? 0);

            if (avgScore < 60)
                areas.Add("Overall content quality needs improvement");
            if (analyses.Average(a => a.RawText?.Length ?? 0) < 500)
                areas.Add("Content length is below optimal (aim for 1000+ words)");

            return areas;
        }

        private async Task<PeriodStats> GetPeriodStats(Guid userId, DateTime start, DateTime end)
        {
            var analyses = await _context.ContentAnalyses
                .Where(a => a.UserId == userId && a.CreatedAt >= start && a.CreatedAt < end)
                .ToListAsync();

            return new PeriodStats
            {
                AnalysisCount = analyses.Count,
                AverageScore = analyses.Any() ? (int)analyses.Average(a => a.Score ?? 0) : 0,
                TotalWords = analyses.Sum(a => a.RawText?.Split().Length ?? 0)
            };
        }

        private double CalculateChange(double current, double previous)
        {
            if (previous == 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        }
    }

    public class AnalyticsDashboard
    {
        public int TotalAnalyses { get; set; }
        public int AverageScore { get; set; }
        public int AnalysesThisMonth { get; set; }
        public int RemainingQuota { get; set; }
        public int MonthlyQuota { get; set; }
        public string SubscriptionTier { get; set; } = "";
        public List<UsagePoint> UsageTrend { get; set; } = new();
        public ScoreDistribution ScoreDistribution { get; set; } = new();
        public List<TopKeyword> TopKeywords { get; set; } = new();
        public List<ActivityItem> RecentActivity { get; set; } = new();
    }

    public class UsagePoint
    {
        public string Date { get; set; } = "";
        public int Count { get; set; }
    }

    public class ScoreDistribution
    {
        public int Excellent { get; set; }
        public int Good { get; set; }
        public int Average { get; set; }
        public int Poor { get; set; }
    }

    public class TopKeyword
    {
        public int Rank { get; set; }
        public string Term { get; set; } = "";
        public int Occurrences { get; set; }
    }

    public class ActivityItem
    {
        public Guid Id { get; set; }
        public int Score { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Summary { get; set; } = "";
        public int WordCount { get; set; }
    }

    public class DailyTrend
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
        public int AverageScore { get; set; }
    }

    public class ContentInsights
    {
        public int AverageContentLength { get; set; }
        public int BestPerformingScore { get; set; }
        public List<string> CommonSuggestions { get; set; } = new();
        public List<string> ImprovementAreas { get; set; } = new();
        public double ContentVelocity { get; set; }
    }

    public class PeriodStats
    {
        public int AnalysisCount { get; set; }
        public int AverageScore { get; set; }
        public int TotalWords { get; set; }
    }

    public class PeriodComparison
    {
        public PeriodStats Period1 { get; set; } = new();
        public PeriodStats Period2 { get; set; } = new();
        public double AnalysisCountChange { get; set; }
        public double AverageScoreChange { get; set; }
        public double ContentVolumeChange { get; set; }
    }

    public class GlobalStats
    {
        public int TotalUsers { get; set; }
        public int TotalAnalyses { get; set; }
        public int AnalysesToday { get; set; }
        public Dictionary<string, int> TierDistribution { get; set; } = new();
        public double AverageAnalysesPerUser { get; set; }
    }
}
