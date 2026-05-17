using System.Text.Json.Serialization;

namespace SEOBrain.API.DTOs
{
    public class CreateAnalysisDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class KeywordDto
    {
        public string Keyword { get; set; } = string.Empty;
        public double Density { get; set; }
        public string Importance { get; set; } = string.Empty;
    }

    public class AnalysisResultDto
    {
        public Guid Id { get; set; }
        public int Score { get; set; }
        public List<string> Suggestions { get; set; } = new();
        public string Summary { get; set; } = string.Empty;
        public List<KeywordDto> Keywords { get; set; } = new();
        public int ReadabilityScore { get; set; }
    }

    // FastAPI contracts
    public class AiAnalyzeRequestDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class AiAnalyzeResponseDto
    {
        public int Score { get; set; }
        public List<string> Suggestions { get; set; } = new();
        public string Summary { get; set; } = string.Empty;
        public List<KeywordDto> Keywords { get; set; } = new();
        public int ReadabilityScore { get; set; }
    }

    public class AiCompetitorRequestDto
    {
        [JsonPropertyName("your_content")]
        public string YourContent { get; set; } = string.Empty;

        [JsonPropertyName("competitor_content")]
        public string CompetitorContent { get; set; } = string.Empty;

        [JsonPropertyName("target_keyword")]
        public string TargetKeyword { get; set; } = string.Empty;
    }

    public class AiCompetitorResponseDto
    {
        [JsonPropertyName("your_metrics")]
        public AiMetricDto YourMetrics { get; set; } = new();

        [JsonPropertyName("competitor_metrics")]
        public AiMetricDto CompetitorMetrics { get; set; } = new();

        [JsonPropertyName("comparison")]
        public AiComparisonDto Comparison { get; set; } = new();

        [JsonPropertyName("recommendations")]
        public List<string> Recommendations { get; set; } = new();

        [JsonPropertyName("content_gaps")]
        public List<string> ContentGaps { get; set; } = new();
    }

    public class AiMetricDto
    {
        [JsonPropertyName("word_count")]
        public int WordCount { get; set; }

        [JsonPropertyName("readability")]
        public int Readability { get; set; }

        [JsonPropertyName("score")]
        public int Score { get; set; }
    }

    public class AiComparisonDto
    {
        [JsonPropertyName("word_count_diff")]
        public int WordCountDiff { get; set; }

        [JsonPropertyName("winner")]
        public string Winner { get; set; } = string.Empty;
    }

    public class AiAuditRequestDto
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("meta_description")]
        public string? MetaDescription { get; set; }

        [JsonPropertyName("h1")]
        public string? H1 { get; set; }

        [JsonPropertyName("h2_count")]
        public int H2Count { get; set; }

        [JsonPropertyName("h3_count")]
        public int H3Count { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [JsonPropertyName("primary_keyword")]
        public string? PrimaryKeyword { get; set; }
    }

    public class AiAuditResponseDto
    {
        [JsonPropertyName("overall_score")]
        public int OverallScore { get; set; }

        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("priority_fixes")]
        public List<string> PriorityFixes { get; set; } = new();

        [JsonPropertyName("schema_opportunities")]
        public List<string> SchemaOpportunities { get; set; } = new();
    }

    public class AiMetaSchemaRequestDto
    {
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("primary_keyword")]
        public string PrimaryKeyword { get; set; } = string.Empty;

        [JsonPropertyName("schema_type")]
        public string SchemaType { get; set; } = "Article";
    }

    public class AiMetaSchemaResponseDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("meta_description")]
        public string MetaDescription { get; set; } = string.Empty;

        [JsonPropertyName("og_title")]
        public string OgTitle { get; set; } = string.Empty;

        [JsonPropertyName("og_description")]
        public string OgDescription { get; set; } = string.Empty;

        [JsonPropertyName("url_slug")]
        public string UrlSlug { get; set; } = string.Empty;

        [JsonPropertyName("schema_json")]
        public string SchemaJson { get; set; } = string.Empty;
    }

    public class AiKeywordClusterRequestDto
    {
        [JsonPropertyName("topic")]
        public string Topic { get; set; } = string.Empty;

        [JsonPropertyName("target_audience")]
        public string TargetAudience { get; set; } = "General";
    }

    public class AiKeywordClusterResponseDto
    {
        [JsonPropertyName("topic")]
        public string Topic { get; set; } = string.Empty;

        [JsonPropertyName("clusters")]
        public List<AiClusterDto> Clusters { get; set; } = new();
    }

    public class AiClusterDto
    {
        [JsonPropertyName("cluster_name")]
        public string ClusterName { get; set; } = string.Empty;

        [JsonPropertyName("intent")]
        public string Intent { get; set; } = string.Empty;

        [JsonPropertyName("keywords")]
        public List<string> Keywords { get; set; } = new();

        [JsonPropertyName("difficulty")]
        public string Difficulty { get; set; } = string.Empty;

        [JsonPropertyName("search_volume")]
        public string SearchVolume { get; set; } = string.Empty;

        [JsonPropertyName("suggested_title")]
        public string SuggestedTitle { get; set; } = string.Empty;
    }
}
