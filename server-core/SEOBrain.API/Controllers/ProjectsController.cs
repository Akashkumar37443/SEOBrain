using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SEOBrain.API.DTOs;
using SEOBrain.API.Models;
using SEOBrain.API.Repositories;
using SEOBrain.API.Services;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectRepository _projectRepository;
        private readonly IProcessingService _processingService;

        public ProjectsController(IProjectRepository projectRepository, IProcessingService processingService)
        {
            _projectRepository = projectRepository;
            _processingService = processingService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectDto>>> GetAll()
        {
            var projects = await _projectRepository.GetAllAsync();
            var projectDtos = projects.Select(p => new ProjectDto
            {
                Id = p.Id,
                Title = p.Title,
                OriginalContent = p.OriginalContent,
                OptimizedContent = p.OptimizedContent,
                SEO_Score = p.SEO_Score,
                UserId = p.UserId,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            });
            return Ok(projectDtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDto>> GetById(Guid id)
        {
            var project = await _projectRepository.GetByIdAsync(id);
            if (project == null) return NotFound();

            var projectDto = new ProjectDto
            {
                Id = project.Id,
                Title = project.Title,
                OriginalContent = project.OriginalContent,
                OptimizedContent = project.OptimizedContent,
                SEO_Score = project.SEO_Score,
                UserId = project.UserId,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt
            };
            return Ok(projectDto);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ProjectDto>>> GetByUserId(Guid userId)
        {
            var projects = await _projectRepository.GetByUserIdAsync(userId);
            var projectDtos = projects.Select(p => new ProjectDto
            {
                Id = p.Id,
                Title = p.Title,
                OriginalContent = p.OriginalContent,
                OptimizedContent = p.OptimizedContent,
                SEO_Score = p.SEO_Score,
                UserId = p.UserId,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            });
            return Ok(projectDtos);
        }

        [HttpPost]
        public async Task<ActionResult<ProjectDto>> Create([FromBody] CreateProjectDto createProjectDto)
        {
            var project = new Project
            {
                Title = createProjectDto.Title,
                OriginalContent = createProjectDto.OriginalContent,
                UserId = createProjectDto.UserId
            };

            var createdProject = await _projectRepository.CreateAsync(project);

            var projectDto = new ProjectDto
            {
                Id = createdProject.Id,
                Title = createdProject.Title,
                OriginalContent = createdProject.OriginalContent,
                OptimizedContent = createdProject.OptimizedContent,
                SEO_Score = createdProject.SEO_Score,
                UserId = createdProject.UserId,
                CreatedAt = createdProject.CreatedAt,
                UpdatedAt = createdProject.UpdatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = createdProject.Id }, projectDto);
        }

        [HttpPost("{id}/analyze")]
        public async Task<ActionResult<ProjectDto>> AnalyzeProject(Guid id)
        {
            var project = await _projectRepository.GetByIdAsync(id);
            if (project == null) return NotFound();

            if (string.IsNullOrEmpty(project.OriginalContent))
            {
                return BadRequest("Project has no content to analyze");
            }

            var analysisResult = await _processingService.AnalyzeTextAsync(project.OriginalContent);

            project.OptimizedContent = analysisResult.Suggestions.FirstOrDefault() ?? project.OriginalContent;
            project.SEO_Score = analysisResult.SeoScore;

            var updatedProject = await _projectRepository.UpdateAsync(project);

            var projectDto = new ProjectDto
            {
                Id = updatedProject.Id,
                Title = updatedProject.Title,
                OriginalContent = updatedProject.OriginalContent,
                OptimizedContent = updatedProject.OptimizedContent,
                SEO_Score = updatedProject.SEO_Score,
                UserId = updatedProject.UserId,
                CreatedAt = updatedProject.CreatedAt,
                UpdatedAt = updatedProject.UpdatedAt
            };

            return Ok(projectDto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProjectDto>> Update(Guid id, [FromBody] UpdateProjectDto updateProjectDto)
        {
            var project = await _projectRepository.GetByIdAsync(id);
            if (project == null) return NotFound();

            if (!string.IsNullOrEmpty(updateProjectDto.Title))
                project.Title = updateProjectDto.Title;

            if (updateProjectDto.OriginalContent != null)
                project.OriginalContent = updateProjectDto.OriginalContent;

            if (updateProjectDto.OptimizedContent != null)
                project.OptimizedContent = updateProjectDto.OptimizedContent;

            if (updateProjectDto.SEO_Score.HasValue)
                project.SEO_Score = updateProjectDto.SEO_Score.Value;

            var updatedProject = await _projectRepository.UpdateAsync(project);

            var projectDto = new ProjectDto
            {
                Id = updatedProject.Id,
                Title = updatedProject.Title,
                OriginalContent = updatedProject.OriginalContent,
                OptimizedContent = updatedProject.OptimizedContent,
                SEO_Score = updatedProject.SEO_Score,
                UserId = updatedProject.UserId,
                CreatedAt = updatedProject.CreatedAt,
                UpdatedAt = updatedProject.UpdatedAt
            };

            return Ok(projectDto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _projectRepository.DeleteAsync(id);
            if (!result) return NotFound();

            return NoContent();
        }
    }
}
