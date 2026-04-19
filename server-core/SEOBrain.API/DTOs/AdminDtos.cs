namespace SEOBrain.API.DTOs
{
    // Admin User Management DTOs
    public class AdminUserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = "user";
        public bool IsActive { get; set; } = true;
        public string SubscriptionTier { get; set; } = "free";
        public int MonthlyAnalysisQuota { get; set; }
        public int AnalysisUsedThisMonth { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class AdminUserListResponseDto
    {
        public List<AdminUserDto> Users { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public bool IsActive { get; set; }
    }

    public class UpdateUserRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateUserQuotaDto
    {
        public int MonthlyAnalysisQuota { get; set; }
    }

    // Admin Stats DTOs
    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalAnalyses { get; set; }
        public int NewUsersToday { get; set; }
        public int NewUsersThisWeek { get; set; }
        public int NewUsersThisMonth { get; set; }
        public int TotalAnalysesToday { get; set; }
        public int TotalAnalysesThisWeek { get; set; }
        public int TotalAnalysesThisMonth { get; set; }
        public double AverageScore { get; set; }
        public Dictionary<string, int> UsersByTier { get; set; } = new();
        public List<DailyActivityDto> RecentActivity { get; set; } = new();
    }

    public class DailyActivityDto
    {
        public DateTime Date { get; set; }
        public int NewUsers { get; set; }
        public int NewAnalyses { get; set; }
    }

    // System Status DTOs
    public class SystemStatusDto
    {
        public ServiceStatusDto DotNetApi { get; set; } = new();
        public ServiceStatusDto FastApi { get; set; } = new();
        public ServiceStatusDto SqlServer { get; set; } = new();
        public ServiceStatusDto AiService { get; set; } = new();
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    }

    public class ServiceStatusDto
    {
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = "unknown"; // online, offline, warning
        public string Message { get; set; } = string.Empty;
        public DateTime? LastChecked { get; set; }
        public int? ResponseTimeMs { get; set; }
    }

    // Admin Settings DTOs
    public class AdminSettingsDto
    {
        public bool MaintenanceMode { get; set; }
        public bool EmailNotificationsEnabled { get; set; }
        public bool RequireTwoFactorForAdmin { get; set; }
        public int MaxLoginAttempts { get; set; } = 5;
        public int DefaultFreeQuota { get; set; } = 10;
        public int DefaultProQuota { get; set; } = 100;
        public int DefaultEnterpriseQuota { get; set; } = 500;
    }

    public class UpdateAdminSettingsDto
    {
        public bool? MaintenanceMode { get; set; }
        public bool? EmailNotificationsEnabled { get; set; }
        public bool? RequireTwoFactorForAdmin { get; set; }
        public int? MaxLoginAttempts { get; set; }
        public int? DefaultFreeQuota { get; set; }
        public int? DefaultProQuota { get; set; }
        public int? DefaultEnterpriseQuota { get; set; }
    }

    // Email Settings DTOs
    public class EmailSettingsDto
    {
        public string SmtpHost { get; set; } = "smtp.gmail.com";
        public int SmtpPort { get; set; } = 587;
        public string SmtpUser { get; set; } = "";
        public string SmtpPassword { get; set; } = ""; // Will be masked in response
        public string FromEmail { get; set; } = "";
        public string FromName { get; set; } = "SEOBrain";
        public string AdminEmail { get; set; } = "";
        public bool IsConfigured { get; set; } = false;
    }

    public class UpdateEmailSettingsDto
    {
        public string? SmtpHost { get; set; }
        public int? SmtpPort { get; set; }
        public string? SmtpUser { get; set; }
        public string? SmtpPassword { get; set; }
        public string? FromEmail { get; set; }
        public string? FromName { get; set; }
        public string? AdminEmail { get; set; }
    }

    public class SendTestEmailDto
    {
        public string ToEmail { get; set; } = "";
    }

    // Activity Log DTOs
    public class ActivityLogDto
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string IpAddress { get; set; } = string.Empty;
    }

    // User Create/Update DTOs for Admin
    public class AdminCreateUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = "user";
        public string SubscriptionTier { get; set; } = "free";
        public int MonthlyAnalysisQuota { get; set; } = 10;
    }

    public class BulkActionDto
    {
        public List<Guid> UserIds { get; set; } = new();
        public string Action { get; set; } = string.Empty; // activate, deactivate, delete
    }

    public class BulkActionResultDto
    {
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
