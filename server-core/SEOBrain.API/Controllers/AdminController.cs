using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEOBrain.API.Data;
using SEOBrain.API.DTOs;
using SEOBrain.API.Models;
using SEOBrain.API.Services;
using System.Security.Claims;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AdminController(
            UserManager<User> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            ApplicationDbContext context,
            ILogger<AdminController> logger,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IEmailService emailService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _emailService = emailService;
        }

        // Helper method to check if current user is admin
        private async Task<bool> IsCurrentUserAdmin()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return false;

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;

            return await _userManager.IsInRoleAsync(user, "Admin");
        }

        // GET /api/admin/users - Get all users with pagination
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var query = _userManager.Users.AsQueryable();

                // Apply search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    search = search.ToLower();
                    query = query.Where(u => 
                        u.Email.ToLower().Contains(search) ||
                        u.FirstName.ToLower().Contains(search) ||
                        u.LastName.ToLower().Contains(search));
                }

                var totalCount = await query.CountAsync();
                var users = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var userDtos = new List<AdminUserDto>();
                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userDtos.Add(new AdminUserDto
                    {
                        Id = user.Id,
                        Email = user.Email ?? string.Empty,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Role = roles.FirstOrDefault() ?? "user",
                        IsActive = user.IsActive,
                        SubscriptionTier = user.SubscriptionTier,
                        MonthlyAnalysisQuota = user.MonthlyAnalysisQuota,
                        AnalysisUsedThisMonth = user.AnalysisUsedThisMonth,
                        CreatedAt = user.CreatedAt,
                        LastLoginAt = user.LastLoginAt
                    });
                }

                return Ok(new AdminUserListResponseDto
                {
                    Users = userDtos,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users for admin");
                return StatusCode(500, new { message = "Failed to fetch users" });
            }
        }

        // GET /api/admin/users/{id} - Get single user details
        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                    return NotFound(new { message = "User not found" });

                var roles = await _userManager.GetRolesAsync(user);
                var userDto = new AdminUserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = roles.FirstOrDefault() ?? "user",
                    IsActive = user.IsActive,
                    SubscriptionTier = user.SubscriptionTier,
                    MonthlyAnalysisQuota = user.MonthlyAnalysisQuota,
                    AnalysisUsedThisMonth = user.AnalysisUsedThisMonth,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user {UserId} for admin", id);
                return StatusCode(500, new { message = "Failed to fetch user" });
            }
        }

        // PUT /api/admin/users/{id}/status - Activate/Deactivate user
        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusDto dto)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Prevent deactivating yourself
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (currentUserId == id.ToString() && !dto.IsActive)
                    return BadRequest(new { message = "Cannot deactivate your own account" });

                user.IsActive = dto.IsActive;
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                    return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

                _logger.LogInformation("Admin {AdminId} updated user {UserId} status to {Status}",
                    currentUserId, id, dto.IsActive ? "active" : "inactive");

                // Send admin notification
                try
                {
                    await _emailService.SendAdminNotificationAsync(
                        $"User {(dto.IsActive ? "Activated" : "Deactivated")}",
                        $"User {user.Email} ({user.FirstName} {user.LastName}) has been {(dto.IsActive ? "activated" : "deactivated")} by admin.");
                }
                catch { /* Ignore email failures */ }

                return Ok(new { message = $"User {(dto.IsActive ? "activated" : "deactivated")} successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId} status", id);
                return StatusCode(500, new { message = "Failed to update user status" });
            }
        }

        // PUT /api/admin/users/{id}/role - Change user role
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleDto dto)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Validate role
                var validRoles = new[] { "user", "admin", "premium" };
                var roleLower = dto.Role.ToLower();
                if (!validRoles.Contains(roleLower))
                    return BadRequest(new { message = "Invalid role. Valid roles: user, admin, premium" });

                // Get current roles and remove them
                var currentRoles = await _userManager.GetRolesAsync(user);
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                    return BadRequest(new { message = "Failed to remove existing roles" });

                // Add new role
                var addResult = await _userManager.AddToRoleAsync(user, dto.Role.ToLower());
                if (!addResult.Succeeded)
                    return BadRequest(new { message = string.Join(", ", addResult.Errors.Select(e => e.Description)) });

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation("Admin {AdminId} changed user {UserId} role to {Role}",
                    currentUserId, id, dto.Role);

                // Send admin notification
                try
                {
                    await _emailService.SendAdminNotificationAsync(
                        "User Role Changed",
                        $"User {user.Email} ({user.FirstName} {user.LastName}) role has been changed to {dto.Role} by admin.");
                }
                catch { /* Ignore email failures */ }

                return Ok(new { message = $"User role updated to {dto.Role} successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId} role", id);
                return StatusCode(500, new { message = "Failed to update user role" });
            }
        }

        // PUT /api/admin/users/{id}/quota - Update user quota
        [HttpPut("users/{id}/quota")]
        public async Task<IActionResult> UpdateUserQuota(Guid id, [FromBody] UpdateUserQuotaDto dto)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                    return NotFound(new { message = "User not found" });

                user.MonthlyAnalysisQuota = dto.MonthlyAnalysisQuota;
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                    return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

                return Ok(new { message = "User quota updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId} quota", id);
                return StatusCode(500, new { message = "Failed to update user quota" });
            }
        }

        // DELETE /api/admin/users/{id} - Delete user
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Prevent deleting yourself
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (currentUserId == id.ToString())
                    return BadRequest(new { message = "Cannot delete your own account" });

                // Delete related data first
                var analyses = await _context.ContentAnalyses.Where(a => a.UserId == id).ToListAsync();
                _context.ContentAnalyses.RemoveRange(analyses);
                await _context.SaveChangesAsync();

                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                    return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

                _logger.LogInformation("Admin {AdminId} deleted user {UserId}", currentUserId, id);

                // Send admin notification
                try
                {
                    await _emailService.SendAdminNotificationAsync(
                        "User Deleted",
                        $"User {user.Email} ({user.FirstName} {user.LastName}) has been permanently deleted by admin.");
                }
                catch { /* Ignore email failures */ }

                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, new { message = "Failed to delete user" });
            }
        }

        // POST /api/admin/users - Create new user
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserDto dto)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null)
                    return BadRequest(new { message = "Email already registered" });

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = dto.Email,
                    UserName = dto.Email,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    SubscriptionTier = dto.SubscriptionTier,
                    MonthlyAnalysisQuota = dto.MonthlyAnalysisQuota,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)
                    return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

                // Assign role
                var role = dto.Role.ToLower();
                if (!new[] { "user", "admin", "premium" }.Contains(role))
                    role = "user";

                await _userManager.AddToRoleAsync(user, role);

                _logger.LogInformation("Admin created new user {Email} with role {Role}", dto.Email, role);

                // Send welcome email
                try
                {
                    await _emailService.SendWelcomeEmailAsync(user.Email, user.FirstName);
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send welcome email to {Email}", user.Email);
                }

                return Ok(new { message = "User created successfully", userId = user.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, new { message = "Failed to create user" });
            }
        }

        // GET /api/admin/stats - Get admin dashboard stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var now = DateTime.UtcNow;
                var today = now.Date;
                var weekAgo = now.AddDays(-7);
                var monthAgo = now.AddDays(-30);

                // User stats
                var totalUsers = await _userManager.Users.CountAsync();
                var activeUsers = await _userManager.Users.CountAsync(u => u.IsActive);
                var newUsersToday = await _userManager.Users.CountAsync(u => u.CreatedAt.Date == today);
                var newUsersThisWeek = await _userManager.Users.CountAsync(u => u.CreatedAt >= weekAgo);
                var newUsersThisMonth = await _userManager.Users.CountAsync(u => u.CreatedAt >= monthAgo);

                // Analysis stats
                var totalAnalyses = await _context.ContentAnalyses.CountAsync();
                var totalAnalysesToday = await _context.ContentAnalyses.CountAsync(a => a.CreatedAt.Date == today);
                var totalAnalysesThisWeek = await _context.ContentAnalyses.CountAsync(a => a.CreatedAt >= weekAgo);
                var totalAnalysesThisMonth = await _context.ContentAnalyses.CountAsync(a => a.CreatedAt >= monthAgo);

                // Average score
                var avgScore = await _context.ContentAnalyses
                    .Where(a => a.Score.HasValue)
                    .AverageAsync(a => (double?)a.Score.Value) ?? 0;

                // Users by tier
                var usersByTier = await _userManager.Users
                    .GroupBy(u => u.SubscriptionTier)
                    .Select(g => new { Tier = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Tier, x => x.Count);

                // Recent daily activity (last 30 days)
                var recentActivity = await _context.ContentAnalyses
                    .Where(a => a.CreatedAt >= monthAgo)
                    .GroupBy(a => a.CreatedAt.Date)
                    .Select(g => new DailyActivityDto
                    {
                        Date = g.Key,
                        NewAnalyses = g.Count()
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                // Fill in missing dates with 0 analyses
                var allDates = Enumerable.Range(0, 30)
                    .Select(i => today.AddDays(-i))
                    .OrderBy(d => d)
                    .ToList();

                var completeActivity = allDates.Select(date => new DailyActivityDto
                {
                    Date = date,
                    NewAnalyses = recentActivity.FirstOrDefault(a => a.Date == date)?.NewAnalyses ?? 0,
                    NewUsers = _userManager.Users.Count(u => u.CreatedAt.Date == date)
                }).ToList();

                var stats = new AdminStatsDto
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    TotalAnalyses = totalAnalyses,
                    NewUsersToday = newUsersToday,
                    NewUsersThisWeek = newUsersThisWeek,
                    NewUsersThisMonth = newUsersThisMonth,
                    TotalAnalysesToday = totalAnalysesToday,
                    TotalAnalysesThisWeek = totalAnalysesThisWeek,
                    TotalAnalysesThisMonth = totalAnalysesThisMonth,
                    AverageScore = Math.Round(avgScore, 1),
                    UsersByTier = usersByTier,
                    RecentActivity = completeActivity
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admin stats");
                return StatusCode(500, new { message = "Failed to fetch stats" });
            }
        }

        // GET /api/admin/system/status - Get system health status
        [HttpGet("system/status")]
        public async Task<IActionResult> GetSystemStatus()
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(5);

                // Check FastAPI AI Service
                var aiServiceStatus = new ServiceStatusDto
                {
                    Name = "FastAPI AI Service",
                    Status = "unknown"
                };
                try
                {
                    var aiUrl = _configuration["AIService:Url"] ?? "http://localhost:8000";
                    var stopwatch = System.Diagnostics.Stopwatch.StartNew();
                    var response = await client.GetAsync($"{aiUrl}/health");
                    stopwatch.Stop();
                    aiServiceStatus.ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds;
                    aiServiceStatus.Status = response.IsSuccessStatusCode ? "online" : "warning";
                    aiServiceStatus.LastChecked = DateTime.UtcNow;
                }
                catch
                {
                    aiServiceStatus.Status = "offline";
                    aiServiceStatus.LastChecked = DateTime.UtcNow;
                }

                // Check SQL Server (via a simple query)
                var sqlStatus = new ServiceStatusDto
                {
                    Name = "SQL Server",
                    Status = "unknown"
                };
                try
                {
                    var stopwatch = System.Diagnostics.Stopwatch.StartNew();
                    await _context.Database.CanConnectAsync();
                    stopwatch.Stop();
                    sqlStatus.ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds;
                    sqlStatus.Status = "online";
                    sqlStatus.LastChecked = DateTime.UtcNow;
                }
                catch
                {
                    sqlStatus.Status = "offline";
                    sqlStatus.LastChecked = DateTime.UtcNow;
                }

                var status = new SystemStatusDto
                {
                    DotNetApi = new ServiceStatusDto
                    {
                        Name = ".NET Core API",
                        Status = "online",
                        Message = "Running",
                        LastChecked = DateTime.UtcNow
                    },
                    FastApi = aiServiceStatus,
                    SqlServer = sqlStatus,
                    AiService = aiServiceStatus,
                    CheckedAt = DateTime.UtcNow
                };

                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking system status");
                return StatusCode(500, new { message = "Failed to check system status" });
            }
        }

        // GET /api/admin/settings - Get admin settings
        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                // Get settings from database with defaults
                var settings = new AdminSettingsDto
                {
                    MaintenanceMode = await GetSettingAsync("MaintenanceMode", false),
                    EmailNotificationsEnabled = await GetSettingAsync("EmailNotificationsEnabled", true),
                    RequireTwoFactorForAdmin = await GetSettingAsync("RequireTwoFactorForAdmin", false),
                    MaxLoginAttempts = await GetSettingAsync("MaxLoginAttempts", 5),
                    DefaultFreeQuota = await GetSettingAsync("DefaultFreeQuota", 10),
                    DefaultProQuota = await GetSettingAsync("DefaultProQuota", 100),
                    DefaultEnterpriseQuota = await GetSettingAsync("DefaultEnterpriseQuota", 500)
                };

                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admin settings");
                return StatusCode(500, new { message = "Failed to fetch settings" });
            }
        }

        private async Task<T> GetSettingAsync<T>(string key, T defaultValue)
        {
            var setting = await _context.AppSettings.FindAsync(key);
            if (setting == null) return defaultValue;
            
            try
            {
                return (T)Convert.ChangeType(setting.Value, typeof(T));
            }
            catch
            {
                return defaultValue;
            }
        }

        // PUT /api/admin/settings - Update admin settings
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateAdminSettingsDto dto)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                // Persist settings to database
                if (dto.MaintenanceMode.HasValue)
                    await SetSettingAsync("MaintenanceMode", dto.MaintenanceMode.Value);
                if (dto.EmailNotificationsEnabled.HasValue)
                    await SetSettingAsync("EmailNotificationsEnabled", dto.EmailNotificationsEnabled.Value);
                if (dto.RequireTwoFactorForAdmin.HasValue)
                    await SetSettingAsync("RequireTwoFactorForAdmin", dto.RequireTwoFactorForAdmin.Value);
                if (dto.MaxLoginAttempts.HasValue)
                    await SetSettingAsync("MaxLoginAttempts", dto.MaxLoginAttempts.Value);
                if (dto.DefaultFreeQuota.HasValue)
                    await SetSettingAsync("DefaultFreeQuota", dto.DefaultFreeQuota.Value);
                if (dto.DefaultProQuota.HasValue)
                    await SetSettingAsync("DefaultProQuota", dto.DefaultProQuota.Value);
                if (dto.DefaultEnterpriseQuota.HasValue)
                    await SetSettingAsync("DefaultEnterpriseQuota", dto.DefaultEnterpriseQuota.Value);

                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin updated settings");
                return Ok(new { message = "Settings updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating admin settings");
                return StatusCode(500, new { message = "Failed to update settings" });
            }
        }

        private async Task SetSettingAsync<T>(string key, T value)
        {
            var setting = await _context.AppSettings.FindAsync(key);
            if (setting == null)
            {
                setting = new AppSetting { Key = key };
                _context.AppSettings.Add(setting);
            }
            setting.Value = value?.ToString() ?? "";
            setting.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // POST /api/admin/bulk-action - Perform bulk action on users
        [HttpPost("bulk-action")]
        public async Task<IActionResult> BulkAction([FromBody] BulkActionDto dto)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var result = new BulkActionResultDto();
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                foreach (var userId in dto.UserIds)
                {
                    try
                    {
                        // Skip if trying to action yourself
                        if (userId.ToString() == currentUserId)
                        {
                            result.Errors.Add($"Cannot perform action on yourself (user {userId})");
                            result.FailedCount++;
                            continue;
                        }

                        var user = await _userManager.FindByIdAsync(userId.ToString());
                        if (user == null)
                        {
                            result.Errors.Add($"User {userId} not found");
                            result.FailedCount++;
                            continue;
                        }

                        switch (dto.Action.ToLower())
                        {
                            case "activate":
                                user.IsActive = true;
                                await _userManager.UpdateAsync(user);
                                break;
                            case "deactivate":
                                user.IsActive = false;
                                await _userManager.UpdateAsync(user);
                                break;
                            case "delete":
                                var analyses = await _context.ContentAnalyses.Where(a => a.UserId == userId).ToListAsync();
                                _context.ContentAnalyses.RemoveRange(analyses);
                                await _context.SaveChangesAsync();
                                await _userManager.DeleteAsync(user);
                                break;
                            default:
                                result.Errors.Add($"Unknown action: {dto.Action}");
                                result.FailedCount++;
                                continue;
                        }

                        result.SuccessCount++;
                    }
                    catch (Exception ex)
                    {
                        result.Errors.Add($"Error processing user {userId}: {ex.Message}");
                        result.FailedCount++;
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing bulk action");
                return StatusCode(500, new { message = "Failed to perform bulk action" });
            }
        }

        // GET /api/admin/email-settings - Get email configuration
        [HttpGet("email-settings")]
        public async Task<IActionResult> GetEmailSettings()
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var smtpUser = await GetSettingAsync("Email:SmtpUser", "");
                var smtpPass = await GetSettingAsync("Email:SmtpPassword", "");

                var settings = new EmailSettingsDto
                {
                    SmtpHost = await GetSettingAsync("Email:SmtpHost", "smtp.gmail.com"),
                    SmtpPort = await GetSettingAsync("Email:SmtpPort", 587),
                    SmtpUser = smtpUser,
                    SmtpPassword = string.IsNullOrEmpty(smtpPass) ? "" : "********", // Mask password
                    FromEmail = await GetSettingAsync("Email:FromEmail", smtpUser),
                    FromName = await GetSettingAsync("Email:FromName", "SEOBrain"),
                    AdminEmail = await GetSettingAsync("Email:AdminEmail", ""),
                    IsConfigured = !string.IsNullOrEmpty(smtpUser) && !string.IsNullOrEmpty(smtpPass)
                };

                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching email settings");
                return StatusCode(500, new { message = "Failed to fetch email settings" });
            }
        }

        // PUT /api/admin/email-settings - Update email configuration
        [HttpPut("email-settings")]
        public async Task<IActionResult> UpdateEmailSettings([FromBody] UpdateEmailSettingsDto dto)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                if (!string.IsNullOrEmpty(dto.SmtpHost))
                    await SetSettingAsync("Email:SmtpHost", dto.SmtpHost);
                if (dto.SmtpPort.HasValue)
                    await SetSettingAsync("Email:SmtpPort", dto.SmtpPort.Value);
                if (!string.IsNullOrEmpty(dto.SmtpUser))
                    await SetSettingAsync("Email:SmtpUser", dto.SmtpUser);
                if (!string.IsNullOrEmpty(dto.SmtpPassword))
                    await SetSettingAsync("Email:SmtpPassword", dto.SmtpPassword);
                if (!string.IsNullOrEmpty(dto.FromEmail))
                    await SetSettingAsync("Email:FromEmail", dto.FromEmail);
                if (!string.IsNullOrEmpty(dto.FromName))
                    await SetSettingAsync("Email:FromName", dto.FromName);
                if (!string.IsNullOrEmpty(dto.AdminEmail))
                    await SetSettingAsync("Email:AdminEmail", dto.AdminEmail);

                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin updated email settings");
                return Ok(new { message = "Email settings updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating email settings");
                return StatusCode(500, new { message = "Failed to update email settings" });
            }
        }

        // POST /api/admin/send-test-email - Send test email
        [HttpPost("send-test-email")]
        public async Task<IActionResult> SendTestEmail([FromBody] SendTestEmailDto dto)
        {
            try
            {
                if (!await IsCurrentUserAdmin())
                    return Forbid();

                var emailService = HttpContext.RequestServices.GetRequiredService<IEmailService>();
                await emailService.SendEmailAsync(
                    dto.ToEmail,
                    "SEOBrain Test Email",
                    "<h2>This is a test email from SEOBrain</h2><p>If you received this, your email configuration is working correctly!</p>",
                    true
                );

                return Ok(new { message = "Test email sent successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test email");
                return StatusCode(500, new { message = $"Failed to send test email: {ex.Message}" });
            }
        }
    }
}
