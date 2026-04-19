using Microsoft.EntityFrameworkCore;
using SEOBrain.API.Data;
using SEOBrain.API.Models;

namespace SEOBrain.API.Repositories
{
    public interface IContentAnalysisRepository
    {
        Task<ContentAnalysis> CreateAsync(ContentAnalysis analysis);
        Task<ContentAnalysis?> GetByIdAsync(Guid id);
        Task<ContentAnalysis> UpdateAsync(ContentAnalysis analysis);
    }

    public class ContentAnalysisRepository : IContentAnalysisRepository
    {
        private readonly ApplicationDbContext _context;

        public ContentAnalysisRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ContentAnalysis> CreateAsync(ContentAnalysis analysis)
        {
            analysis.CreatedAt = DateTime.UtcNow;
            analysis.UpdatedAt = DateTime.UtcNow;

            _context.ContentAnalyses.Add(analysis);
            await _context.SaveChangesAsync();

            return analysis;
        }

        public async Task<ContentAnalysis?> GetByIdAsync(Guid id)
        {
            return await _context.ContentAnalyses.FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<ContentAnalysis> UpdateAsync(ContentAnalysis analysis)
        {
            analysis.UpdatedAt = DateTime.UtcNow;

            _context.ContentAnalyses.Update(analysis);
            await _context.SaveChangesAsync();

            return analysis;
        }
    }
}
