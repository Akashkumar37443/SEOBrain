using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace SEOBrain.API.Models
{
    public class User : IdentityUser<Guid>
    {
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginAt { get; set; }

        public bool IsActive { get; set; } = true;

        // Subscription fields
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public string SubscriptionTier { get; set; } = "free"; // free, pro, enterprise
        public DateTime? SubscriptionExpiresAt { get; set; }
        public int MonthlyAnalysisQuota { get; set; } = 10; // Free tier: 10/month
        public int AnalysisUsedThisMonth { get; set; } = 0;
        public DateTime? QuotaResetDate { get; set; }

        // Navigation properties
        public virtual ICollection<ContentAnalysis> Analyses { get; set; } = new List<ContentAnalysis>();
    }
}
