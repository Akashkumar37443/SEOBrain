using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/audit")]
    [Authorize]
    public class TechnicalAuditController : ControllerBase
    {
        [HttpPost("content")]
        public async Task<IActionResult> AuditContent([FromBody] ContentAuditRequest request)
        {
            var audit = new TechnicalAuditResult
            {
                MetaTags = AnalyzeMetaTags(request),
                Headings = AnalyzeHeadings(request),
                ContentStructure = AnalyzeContentStructure(request),
                Links = AnalyzeLinks(request),
                Images = AnalyzeImages(request),
                Readability = AnalyzeReadability(request),
                KeywordOptimization = AnalyzeKeywordOptimization(request),
                OverallScore = 0
            };

            // Calculate overall score
            audit.OverallScore = CalculateOverallScore(audit);
            audit.Summary = GenerateSummary(audit);
            audit.PriorityFixes = GetPriorityFixes(audit);

            return Ok(audit);
        }

        private MetaTagsAnalysis AnalyzeMetaTags(ContentAuditRequest request)
        {
            var analysis = new MetaTagsAnalysis { Score = 100 };
            var issues = new List<string>();

            // Title tag analysis
            if (string.IsNullOrEmpty(request.Title))
            {
                issues.Add("Missing title tag - critical for SEO");
                analysis.Score -= 25;
            }
            else
            {
                if (request.Title.Length < 30)
                    issues.Add("Title too short (< 30 chars) - may not be descriptive enough");
                if (request.Title.Length > 60)
                    issues.Add("Title too long (> 60 chars) - may be truncated in SERP");
                if (!request.Title.ToLower().Contains(request.PrimaryKeyword?.ToLower() ?? ""))
                    issues.Add("Primary keyword missing from title tag");
            }

            // Meta description
            if (string.IsNullOrEmpty(request.MetaDescription))
            {
                issues.Add("Missing meta description - reduces CTR potential");
                analysis.Score -= 20;
            }
            else
            {
                if (request.MetaDescription.Length < 120)
                    issues.Add("Meta description too short (< 120 chars)");
                if (request.MetaDescription.Length > 160)
                    issues.Add("Meta description too long (> 160 chars) - will be truncated");
            }

            // Open Graph tags
            if (string.IsNullOrEmpty(request.OgTitle))
                issues.Add("Missing Open Graph title - affects social sharing");
            if (string.IsNullOrEmpty(request.OgDescription))
                issues.Add("Missing Open Graph description - affects social sharing");
            if (string.IsNullOrEmpty(request.OgImage))
                issues.Add("Missing Open Graph image - reduces social engagement");

            // Canonical tag
            if (string.IsNullOrEmpty(request.CanonicalUrl))
            {
                issues.Add("Missing canonical tag - risk of duplicate content issues");
                analysis.Score -= 15;
            }

            analysis.Issues = issues;
            analysis.Score = Math.Max(0, analysis.Score);

            return analysis;
        }

        private HeadingsAnalysis AnalyzeHeadings(ContentAuditRequest request)
        {
            var analysis = new HeadingsAnalysis { Score = 100 };
            var issues = new List<string>();

            if (string.IsNullOrEmpty(request.H1))
            {
                issues.Add("Missing H1 tag - critical for content hierarchy");
                analysis.Score -= 30;
            }
            else
            {
                if (request.H1.ToLower().Contains(request.PrimaryKeyword?.ToLower() ?? ""))
                    analysis.Score += 5;
                if (request.H1.Length > 70)
                    issues.Add("H1 too long (> 70 chars)");
            }

            var h2Count = request.H2s?.Count ?? 0;
            var h3Count = request.H3s?.Count ?? 0;

            if (h2Count == 0)
                issues.Add("No H2 headings - content lacks structure");
            if (h2Count > 0 && h2Count < 2)
                issues.Add("Only 1 H2 - consider adding more for better structure");
            if (h3Count == 0 && h2Count > 2)
                issues.Add("Consider using H3s to further structure content");

            analysis.H1 = request.H1 ?? "";
            analysis.H2Count = h2Count;
            analysis.H3Count = h3Count;
            analysis.Issues = issues;
            analysis.Score = Math.Max(0, analysis.Score);

            return analysis;
        }

        private ContentStructureAnalysis AnalyzeContentStructure(ContentAuditRequest request)
        {
            var analysis = new ContentStructureAnalysis { Score = 100 };
            var issues = new List<string>();
            var wordCount = request.Content?.Split(new[] { ' ', '\n' }, StringSplitOptions.RemoveEmptyEntries).Length ?? 0;

            analysis.WordCount = wordCount;

            // Word count recommendations
            if (wordCount < 300)
            {
                issues.Add($"Content too short ({wordCount} words) - aim for 500+ words minimum");
                analysis.Score -= 20;
            }
            else if (wordCount < 500)
            {
                issues.Add($"Content is {wordCount} words - consider expanding to 1000+ for better SEO");
                analysis.Score -= 10;
            }
            else if (wordCount > 2000)
            {
                analysis.Score += 10;
            }

            // Paragraph structure
            var paragraphs = request.Content?.Split("\n\n").Length ?? 0;
            if (paragraphs < 3)
                issues.Add("Content lacks paragraph breaks - hard to read");

            // Schema markup check
            if (!request.HasSchemaMarkup)
                issues.Add("No Schema.org markup - missing rich snippet opportunities");

            // Internal links
            if (request.InternalLinks < 2)
                issues.Add("Few internal links - add more to improve site structure");

            analysis.ParagraphCount = paragraphs;
            analysis.InternalLinks = request.InternalLinks;
            analysis.HasSchemaMarkup = request.HasSchemaMarkup;
            analysis.Issues = issues;
            analysis.Score = Math.Max(0, analysis.Score);

            return analysis;
        }

        private LinksAnalysis AnalyzeLinks(ContentAuditRequest request)
        {
            var analysis = new LinksAnalysis { Score = 100 };
            var issues = new List<string>();

            if (request.ExternalLinks == 0)
                issues.Add("No external links - cite authoritative sources");
            if (request.ExternalLinks > 0 && request.NofollowExternal == request.ExternalLinks)
                issues.Add("All external links are nofollow - consider dofollow for trusted sources");
            if (request.BrokenLinks > 0)
            {
                issues.Add($"{request.BrokenLinks} broken links detected - fix immediately");
                analysis.Score -= request.BrokenLinks * 10;
            }

            analysis.ExternalLinks = request.ExternalLinks;
            analysis.InternalLinks = request.InternalLinks;
            analysis.BrokenLinks = request.BrokenLinks;
            analysis.Issues = issues;
            analysis.Score = Math.Max(0, analysis.Score);

            return analysis;
        }

        private ImagesAnalysis AnalyzeImages(ContentAuditRequest request)
        {
            var analysis = new ImagesAnalysis { Score = 100 };
            var issues = new List<string>();

            if (request.Images == 0)
            {
                issues.Add("No images - add visual content to improve engagement");
                analysis.Score -= 15;
            }
            else
            {
                if (request.ImagesWithoutAlt > 0)
                {
                    issues.Add($"{request.ImagesWithoutAlt} images missing alt text - critical for accessibility and SEO");
                    analysis.Score -= request.ImagesWithoutAlt * 5;
                }
                if (request.LargeImages > 0)
                    issues.Add($"{request.LargeImages} images over 500KB - optimize for faster loading");
            }

            analysis.ImageCount = request.Images;
            analysis.ImagesWithAlt = request.Images - request.ImagesWithoutAlt;
            analysis.Issues = issues;
            analysis.Score = Math.Max(0, analysis.Score);

            return analysis;
        }

        private ReadabilityAnalysis AnalyzeReadability(ContentAuditRequest request)
        {
            var analysis = new ReadabilityAnalysis { Score = 100 };

            if (!string.IsNullOrEmpty(request.Content))
            {
                var words = request.Content.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).Length;
                var sentences = request.Content.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries).Length;
                var syllables = request.Content.Split(new[] { ' ', '\n' }).Select(w => CountSyllables(w)).Sum();

                // Flesch Reading Ease
                if (sentences > 0 && words > 0)
                {
                    analysis.FleschScore = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
                    analysis.FleschScore = Math.Max(0, Math.Min(100, analysis.FleschScore));

                    if (analysis.FleschScore < 30)
                        analysis.Issues.Add("Very difficult to read - consider simplifying");
                    else if (analysis.FleschScore > 90)
                        analysis.Issues.Add("Very easy to read - good for general audiences");
                }

                analysis.AvgSentenceLength = sentences > 0 ? words / sentences : 0;
                analysis.AvgWordLength = words > 0 ? request.Content.Length / words : 0;
            }

            return analysis;
        }

        private KeywordAnalysis AnalyzeKeywordOptimization(ContentAuditRequest request)
        {
            var analysis = new KeywordAnalysis { Score = 100 };
            var issues = new List<string>();

            if (string.IsNullOrEmpty(request.PrimaryKeyword))
            {
                issues.Add("No primary keyword defined");
                analysis.Score -= 30;
            }
            else
            {
                var content = request.Content?.ToLower() ?? "";
                var keyword = request.PrimaryKeyword.ToLower();
                var occurrences = content.Split(new[] { keyword }, StringSplitOptions.None).Length - 1;
                var wordCount = content.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).Length;
                var density = wordCount > 0 ? (double)occurrences / wordCount * 100 : 0;

                analysis.KeywordDensity = density;
                analysis.Occurrences = occurrences;

                if (density < 0.5)
                    issues.Add($"Keyword density too low ({density:F1}%) - aim for 1-2%");
                else if (density > 3)
                    issues.Add($"Keyword density too high ({density:F1}%) - risk of keyword stuffing");

                // Check keyword placement
                if (!content.StartsWith(keyword) && !(request.H1?.ToLower().Contains(keyword) ?? false))
                    issues.Add("Keyword not in first 100 words or H1");
            }

            analysis.Issues = issues;
            analysis.Score = Math.Max(0, analysis.Score);

            return analysis;
        }

        private int CalculateOverallScore(TechnicalAuditResult audit)
        {
            var scores = new[]
            {
                audit.MetaTags.Score,
                audit.Headings.Score,
                audit.ContentStructure.Score,
                audit.Links.Score,
                audit.Images.Score,
                audit.Readability.Score,
                audit.KeywordOptimization.Score
            };

            return (int)scores.Average();
        }

        private string GenerateSummary(TechnicalAuditResult audit)
        {
            var parts = new List<string>();

            if (audit.OverallScore >= 80)
                parts.Add("Excellent technical SEO foundation!");
            else if (audit.OverallScore >= 60)
                parts.Add("Good technical SEO with room for improvement.");
            else
                parts.Add("Significant technical SEO issues detected.");

            var criticalIssues = new[]
            {
                audit.MetaTags.Issues,
                audit.Headings.Issues,
                audit.ContentStructure.Issues,
                audit.Links.Issues,
                audit.Images.Issues,
                audit.KeywordOptimization.Issues
            }.SelectMany(i => i).Where(i => i.Contains("critical") || i.Contains("Missing title") || i.Contains("Missing H1")).Count();

            if (criticalIssues > 0)
                parts.Add($"Found {criticalIssues} critical issues requiring immediate attention.");

            return string.Join(" ", parts);
        }

        private List<string> GetPriorityFixes(TechnicalAuditResult audit)
        {
            var allIssues = new[]
            {
                audit.MetaTags.Issues,
                audit.Headings.Issues,
                audit.ContentStructure.Issues,
                audit.Links.Issues,
                audit.Images.Issues,
                audit.KeywordOptimization.Issues
            }.SelectMany(i => i);

            return allIssues.Take(5).ToList();
        }

        private int CountSyllables(string word)
        {
            word = word.ToLower();
            string vowels = "aeiouy";
            int count = 0;
            bool lastWasVowel = false;

            foreach (char c in word)
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
            if (count == 0) count = 1;

            return count;
        }
    }

    public class ContentAuditRequest
    {
        public string? Title { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgTitle { get; set; }
        public string? OgDescription { get; set; }
        public string? OgImage { get; set; }
        public string? CanonicalUrl { get; set; }
        public string? H1 { get; set; }
        public List<string>? H2s { get; set; }
        public List<string>? H3s { get; set; }
        public string? Content { get; set; }
        public string? PrimaryKeyword { get; set; }
        public bool HasSchemaMarkup { get; set; }
        public int InternalLinks { get; set; }
        public int ExternalLinks { get; set; }
        public int NofollowExternal { get; set; }
        public int BrokenLinks { get; set; }
        public int Images { get; set; }
        public int ImagesWithoutAlt { get; set; }
        public int LargeImages { get; set; }
    }

    public class TechnicalAuditResult
    {
        public int OverallScore { get; set; }
        public string Summary { get; set; } = "";
        public List<string> PriorityFixes { get; set; } = new();
        public MetaTagsAnalysis MetaTags { get; set; } = new();
        public HeadingsAnalysis Headings { get; set; } = new();
        public ContentStructureAnalysis ContentStructure { get; set; } = new();
        public LinksAnalysis Links { get; set; } = new();
        public ImagesAnalysis Images { get; set; } = new();
        public ReadabilityAnalysis Readability { get; set; } = new();
        public KeywordAnalysis KeywordOptimization { get; set; } = new();
    }

    public class MetaTagsAnalysis
    {
        public int Score { get; set; }
        public List<string> Issues { get; set; } = new();
    }

    public class HeadingsAnalysis
    {
        public int Score { get; set; }
        public string H1 { get; set; } = "";
        public int H2Count { get; set; }
        public int H3Count { get; set; }
        public List<string> Issues { get; set; } = new();
    }

    public class ContentStructureAnalysis
    {
        public int Score { get; set; }
        public int WordCount { get; set; }
        public int ParagraphCount { get; set; }
        public int InternalLinks { get; set; }
        public bool HasSchemaMarkup { get; set; }
        public List<string> Issues { get; set; } = new();
    }

    public class LinksAnalysis
    {
        public int Score { get; set; }
        public int ExternalLinks { get; set; }
        public int InternalLinks { get; set; }
        public int BrokenLinks { get; set; }
        public List<string> Issues { get; set; } = new();
    }

    public class ImagesAnalysis
    {
        public int Score { get; set; }
        public int ImageCount { get; set; }
        public int ImagesWithAlt { get; set; }
        public List<string> Issues { get; set; } = new();
    }

    public class ReadabilityAnalysis
    {
        public int Score { get; set; }
        public double FleschScore { get; set; }
        public double AvgSentenceLength { get; set; }
        public double AvgWordLength { get; set; }
        public List<string> Issues { get; set; } = new();
    }

    public class KeywordAnalysis
    {
        public int Score { get; set; }
        public double KeywordDensity { get; set; }
        public int Occurrences { get; set; }
        public List<string> Issues { get; set; } = new();
    }
}
