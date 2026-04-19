using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/competitor")]
    [Authorize]
    public class CompetitorController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<CompetitorController> _logger;

        public CompetitorController(
            IHttpClientFactory httpClientFactory,
            ILogger<CompetitorController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeCompetitor([FromBody] CompetitorRequest request)
        {
            try
            {
                var analysis = new CompetitorAnalysis
                {
                    YourContent = await AnalyzeContent(request.YourContent, request.TargetKeyword),
                    CompetitorContent = await AnalyzeContent(request.CompetitorContent, request.TargetKeyword),
                    Comparison = new ComparisonResult(),
                    Recommendations = new List<string>()
                };

                // Perform comparison
                analysis.Comparison = CompareContent(analysis.YourContent, analysis.CompetitorContent);
                analysis.Recommendations = GenerateRecommendations(analysis);

                return Ok(analysis);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing competitor content");
                return StatusCode(500, new { message = "Failed to analyze competitor content" });
            }
        }

        private async Task<ContentMetrics> AnalyzeContent(string content, string targetKeyword)
        {
            var metrics = new ContentMetrics();
            var words = content.Split(new[] { ' ', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            
            metrics.WordCount = words.Length;
            metrics.CharacterCount = content.Length;
            
            // Keyword analysis
            var keywordLower = targetKeyword.ToLower();
            var contentLower = content.ToLower();
            metrics.KeywordOccurrences = CountOccurrences(contentLower, keywordLower);
            metrics.KeywordDensity = metrics.WordCount > 0 
                ? (double)metrics.KeywordOccurrences / metrics.WordCount * 100 
                : 0;

            // Heading analysis
            metrics.H1Count = CountOccurrences(content, "<h1") + CountOccurrences(content, "# ");
            metrics.H2Count = CountOccurrences(content, "<h2") + CountOccurrences(content, "## ");
            metrics.H3Count = CountOccurrences(content, "<h3") + CountOccurrences(content, "### ");

            // Readability
            metrics.ReadabilityScore = CalculateReadabilityScore(content);

            // Content quality indicators
            metrics.HasImages = content.Contains("<img") || content.Contains("![");
            metrics.HasLists = content.Contains("<ul") || content.Contains("<ol") || content.Contains("- ");
            metrics.HasTables = content.Contains("<table");
            metrics.HasExternalLinks = content.Contains("http") && !content.Contains("http://localhost");

            // Calculate overall score
            metrics.SeoScore = CalculateSeoScore(metrics);

            return metrics;
        }

        private ComparisonResult CompareContent(ContentMetrics yours, ContentMetrics competitor)
        {
            var comparison = new ComparisonResult();

            // Word count comparison
            comparison.WordCountDiff = yours.WordCount - competitor.WordCount;
            comparison.WordCountAdvantage = yours.WordCount > competitor.WordCount ? "yours" : "competitor";

            // Score comparison
            comparison.ScoreDiff = yours.SeoScore - competitor.SeoScore;
            comparison.ScoreAdvantage = yours.SeoScore > competitor.SeoScore ? "yours" : "competitor";

            // Keyword density comparison
            comparison.KeywordDensityDiff = yours.KeywordDensity - competitor.KeywordDensity;
            comparison.KeywordAdvantage = Math.Abs(yours.KeywordDensity - 1.5) < Math.Abs(competitor.KeywordDensity - 1.5) 
                ? "yours" : "competitor";

            // Readability comparison
            comparison.ReadabilityDiff = yours.ReadabilityScore - competitor.ReadabilityScore;
            comparison.ReadabilityAdvantage = yours.ReadabilityScore > competitor.ReadabilityScore ? "yours" : "competitor";

            // Structure comparison
            comparison.HeadingAdvantage = (yours.H2Count + yours.H3Count) > (competitor.H2Count + competitor.H3Count) 
                ? "yours" : "competitor";

            return comparison;
        }

        private List<string> GenerateRecommendations(CompetitorAnalysis analysis)
        {
            var recommendations = new List<string>();
            var yours = analysis.YourContent;
            var competitor = analysis.CompetitorContent;
            var comparison = analysis.Comparison;

            // Content length
            if (comparison.WordCountDiff < 0)
                recommendations.Add($"🔍 Your content is {Math.Abs(comparison.WordCountDiff)} words shorter. Consider expanding to match competitor's depth.");
            else if (comparison.WordCountDiff > 200)
                recommendations.Add($"✅ Your content is {comparison.WordCountDiff} words longer - good for comprehensive coverage!");

            // Keyword optimization
            if (yours.KeywordDensity < 0.5)
                recommendations.Add($"🎯 Increase keyword usage. Current density: {yours.KeywordDensity:F1}% (target: 1-2%)");
            else if (yours.KeywordDensity > 2.5)
                recommendations.Add($"⚠️ Reduce keyword density ({yours.KeywordDensity:F1}%) to avoid keyword stuffing");

            // Headings
            if (yours.H2Count < 2)
                recommendations.Add("📑 Add more H2 headings to improve content structure");
            if (yours.H3Count < 3 && yours.WordCount > 500)
                recommendations.Add("📑 Use H3 subheadings for better content organization");

            // Readability
            if (comparison.ReadabilityDiff < 0)
                recommendations.Add("✏️ Improve readability - competitor's content is easier to read");

            // Rich content
            if (!yours.HasImages && competitor.HasImages)
                recommendations.Add("🖼️ Add images - competitor uses visual content");
            if (!yours.HasLists && competitor.HasLists)
                recommendations.Add("📋 Use bullet points or numbered lists for better scannability");
            if (!yours.HasExternalLinks && competitor.HasExternalLinks)
                recommendations.Add("🔗 Add authoritative external links - competitor cites sources");

            // Strengths
            if (yours.SeoScore > competitor.SeoScore)
                recommendations.Add("🌟 Your content scores higher overall - maintain these practices!");

            return recommendations;
        }

        private int CountOccurrences(string text, string pattern)
        {
            if (string.IsNullOrEmpty(text) || string.IsNullOrEmpty(pattern))
                return 0;
            return (text.Length - text.Replace(pattern, "").Length) / pattern.Length;
        }

        private double CalculateReadabilityScore(string text)
        {
            var sentences = text.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries).Length;
            var words = text.Split(new[] { ' ', '\n' }, StringSplitOptions.RemoveEmptyEntries).Length;
            var syllables = text.Split(' ').Sum(w => CountSyllables(w));

            if (sentences == 0 || words == 0) return 50;

            // Flesch Reading Ease
            var score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
            return Math.Max(0, Math.Min(100, score));
        }

        private int CountSyllables(string word)
        {
            word = word.ToLower().Trim();
            if (word.Length <= 3) return 1;

            var vowels = "aeiouy";
            var count = 0;
            var lastWasVowel = false;

            foreach (var c in word)
            {
                if (vowels.Contains(c))
                {
                    if (!lastWasVowel) count++;
                    lastWasVowel = true;
                }
                else
                {
                    lastWasVowel = false;
                }
            }

            if (word.EndsWith('e')) count--;
            return Math.Max(1, count);
        }

        private int CalculateSeoScore(ContentMetrics metrics)
        {
            var score = 50;

            // Content length (optimal: 1000-2000 words)
            if (metrics.WordCount >= 500) score += 10;
            if (metrics.WordCount >= 1000) score += 10;
            if (metrics.WordCount >= 1500) score += 5;

            // Keyword density (optimal: 1-2%)
            if (metrics.KeywordDensity >= 0.5 && metrics.KeywordDensity <= 3)
                score += 10;

            // Structure
            score += Math.Min(10, metrics.H2Count * 3);
            score += Math.Min(10, metrics.H3Count * 2);

            // Readability
            if (metrics.ReadabilityScore >= 50 && metrics.ReadabilityScore <= 80)
                score += 10;

            // Rich content
            if (metrics.HasImages) score += 5;
            if (metrics.HasLists) score += 5;
            if (metrics.HasExternalLinks) score += 5;

            return Math.Min(100, score);
        }
    }

    public class CompetitorRequest
    {
        public string YourContent { get; set; } = "";
        public string CompetitorContent { get; set; } = "";
        public string TargetKeyword { get; set; } = "";
    }

    public class CompetitorAnalysis
    {
        public ContentMetrics YourContent { get; set; } = new();
        public ContentMetrics CompetitorContent { get; set; } = new();
        public ComparisonResult Comparison { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
    }

    public class ContentMetrics
    {
        public int WordCount { get; set; }
        public int CharacterCount { get; set; }
        public int KeywordOccurrences { get; set; }
        public double KeywordDensity { get; set; }
        public int H1Count { get; set; }
        public int H2Count { get; set; }
        public int H3Count { get; set; }
        public double ReadabilityScore { get; set; }
        public bool HasImages { get; set; }
        public bool HasLists { get; set; }
        public bool HasTables { get; set; }
        public bool HasExternalLinks { get; set; }
        public int SeoScore { get; set; }
    }

    public class ComparisonResult
    {
        public int WordCountDiff { get; set; }
        public string WordCountAdvantage { get; set; } = "";
        public int ScoreDiff { get; set; }
        public string ScoreAdvantage { get; set; } = "";
        public double KeywordDensityDiff { get; set; }
        public string KeywordAdvantage { get; set; } = "";
        public double ReadabilityDiff { get; set; }
        public string ReadabilityAdvantage { get; set; } = "";
        public string HeadingAdvantage { get; set; } = "";
    }
}
