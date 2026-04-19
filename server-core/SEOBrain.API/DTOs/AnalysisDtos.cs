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

    // FastAPI contract
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
}
