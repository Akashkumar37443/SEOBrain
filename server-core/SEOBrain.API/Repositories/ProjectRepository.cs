using Microsoft.EntityFrameworkCore;
using System.Linq;
using SEOBrain.API.Data;
using SEOBrain.API.Models;

namespace SEOBrain.API.Repositories
{
    public interface IProjectRepository
    {
        Task<IEnumerable<Project>> GetAllAsync();
        Task<Project?> GetByIdAsync(Guid id);
        Task<IEnumerable<Project>> GetByUserIdAsync(Guid userId);
        Task<Project> CreateAsync(Project project);
        Task<Project> UpdateAsync(Project project);
        Task<bool> DeleteAsync(Guid id);
    }

    public class ProjectRepository : IProjectRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Project>> GetAllAsync()
        {
            return await _context.Projects.ToListAsync();
        }

        public async Task<Project?> GetByIdAsync(Guid id)
        {
            return await _context.Projects.FindAsync(id);
        }

        public async Task<IEnumerable<Project>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Projects.Where(p => p.UserId == userId).ToListAsync();
        }

        public async Task<Project> CreateAsync(Project project)
        {
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;
            
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            
            return project;
        }

        public async Task<Project> UpdateAsync(Project project)
        {
            project.UpdatedAt = DateTime.UtcNow;
            
            _context.Projects.Update(project);
            await _context.SaveChangesAsync();
            
            return project;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return false;

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            
            return true;
        }
    }
}
