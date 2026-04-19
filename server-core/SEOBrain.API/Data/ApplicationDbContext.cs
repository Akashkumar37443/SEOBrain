using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SEOBrain.API.Models;
using SEOBrain.API.Controllers;

namespace SEOBrain.API.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Project> Projects { get; set; }
        public DbSet<ContentAnalysis> ContentAnalyses { get; set; }
        public DbSet<AnalysisFeedback> AnalysisFeedbacks { get; set; }
        public DbSet<AppSetting> AppSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.OriginalContent).HasColumnType("nvarchar(max)");
                entity.Property(e => e.OptimizedContent).HasColumnType("nvarchar(max)");
                entity.Property(e => e.SEO_Score).HasDefaultValue(0);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            modelBuilder.Entity<ContentAnalysis>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.RawText).IsRequired().HasColumnType("nvarchar(max)");
                entity.Property(e => e.Score);
                entity.Property(e => e.SuggestionsJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.Summary).HasColumnType("nvarchar(max)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne<User>()
                    .WithMany(u => u.Analyses)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AnalysisFeedback>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ContentAnalysisId).IsRequired();
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.Rating).IsRequired();
                entity.Property(e => e.Comments).HasColumnType("nvarchar(1000)");
                entity.Property(e => e.SuggestedImprovements).HasColumnType("nvarchar(1000)");
                entity.Property(e => e.KeywordsMissing).HasColumnType("nvarchar(500)");
                entity.Property(e => e.IncorrectSuggestions).HasColumnType("nvarchar(1000)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.SubscriptionTier).HasMaxLength(50);
                entity.Property(e => e.StripeCustomerId).HasMaxLength(100);
                entity.Property(e => e.StripeSubscriptionId).HasMaxLength(100);
            });

            modelBuilder.Entity<AppSetting>(entity =>
            {
                entity.HasKey(e => e.Key);
                entity.Property(e => e.Key).HasMaxLength(100);
                entity.Property(e => e.Value).HasMaxLength(1000);
            });
        }
    }
}
