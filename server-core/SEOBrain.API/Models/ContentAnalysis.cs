using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEOBrain.API.Models
{
    public class ContentAnalysis
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string RawText { get; set; } = string.Empty;

        public int? Score { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? SuggestionsJson { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? Summary { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
