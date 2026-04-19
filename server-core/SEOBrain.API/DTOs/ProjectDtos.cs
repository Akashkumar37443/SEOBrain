namespace SEOBrain.API.DTOs
{
    public class ProjectDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? OriginalContent { get; set; }
        public string? OptimizedContent { get; set; }
        public int SEO_Score { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateProjectDto
    {
        public string Title { get; set; } = string.Empty;
        public string? OriginalContent { get; set; }
        public Guid UserId { get; set; }
    }

    public class UpdateProjectDto
    {
        public string? Title { get; set; }
        public string? OriginalContent { get; set; }
        public string? OptimizedContent { get; set; }
        public int? SEO_Score { get; set; }
    }

    public class AIAnalysisRequestDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class AIAnalysisResponseDto
    {
        public List<string> Suggestions { get; set; } = new();
        public int SeoScore { get; set; }
        public List<string> Keywords { get; set; } = new();
    }
}
