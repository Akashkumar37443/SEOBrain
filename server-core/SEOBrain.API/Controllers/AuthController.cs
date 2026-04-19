using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SEOBrain.API.DTOs;
using SEOBrain.API.Models;
using SEOBrain.API.Services;
using System.Security.Claims;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IJwtService jwtService,
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            try
            {
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
                    SubscriptionTier = "free",
                    MonthlyAnalysisQuota = 10,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)
                    return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

                var token = _jwtService.GenerateToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                user.LastLoginAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);

                _logger.LogInformation("New user registered: {Email}", dto.Email);

                // Send welcome email
                try
                {
                    await _emailService.SendWelcomeEmailAsync(user.Email, user.FirstName);
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send welcome email to {Email}", user.Email);
                    // Don't fail registration if email fails
                }

                var newUserRoles = await _userManager.GetRolesAsync(user);

                return Ok(new AuthResponseDto
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Role = newUserRoles.FirstOrDefault() ?? "user",
                        SubscriptionTier = user.SubscriptionTier,
                        MonthlyAnalysisQuota = user.MonthlyAnalysisQuota,
                        AnalysisUsedThisMonth = user.AnalysisUsedThisMonth,
                        RemainingAnalyses = user.MonthlyAnalysisQuota - user.AnalysisUsedThisMonth
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
                return StatusCode(500, new { message = "Registration failed" });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(dto.Email);
                if (user == null)
                    return Unauthorized(new { message = "Invalid credentials" });

                if (!await _userManager.CheckPasswordAsync(user, dto.Password))
                    return Unauthorized(new { message = "Invalid credentials" });

                if (!user.IsActive)
                    return Unauthorized(new { message = "Account is deactivated" });

                // Reset quota if it's a new month
                if (user.QuotaResetDate.HasValue && user.QuotaResetDate.Value < DateTime.UtcNow)
                {
                    user.AnalysisUsedThisMonth = 0;
                    user.QuotaResetDate = DateTime.UtcNow.AddMonths(1);
                    await _userManager.UpdateAsync(user);
                }

                var token = _jwtService.GenerateToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                user.LastLoginAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);

                _logger.LogInformation("User logged in: {Email}", dto.Email);

                var loginRoles = await _userManager.GetRolesAsync(user);

                return Ok(new AuthResponseDto
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Role = loginRoles.FirstOrDefault() ?? "user",
                        SubscriptionTier = user.SubscriptionTier,
                        MonthlyAnalysisQuota = user.MonthlyAnalysisQuota,
                        AnalysisUsedThisMonth = user.AnalysisUsedThisMonth,
                        RemainingAnalyses = user.MonthlyAnalysisQuota - user.AnalysisUsedThisMonth
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new { message = "Login failed" });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound();

            var meRoles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = meRoles.FirstOrDefault() ?? "user",
                SubscriptionTier = user.SubscriptionTier,
                MonthlyAnalysisQuota = user.MonthlyAnalysisQuota,
                AnalysisUsedThisMonth = user.AnalysisUsedThisMonth,
                RemainingAnalyses = user.MonthlyAnalysisQuota - user.AnalysisUsedThisMonth
            });
        }

        [Authorize]
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
        {
            var principal = _jwtService.ValidateToken(dto.RefreshToken);
            if (principal == null)
                return Unauthorized(new { message = "Invalid refresh token" });

            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            var newToken = _jwtService.GenerateToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            var refreshRoles = await _userManager.GetRolesAsync(user);

            return Ok(new AuthResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = refreshRoles.FirstOrDefault() ?? "user",
                    SubscriptionTier = user.SubscriptionTier,
                    MonthlyAnalysisQuota = user.MonthlyAnalysisQuota,
                    AnalysisUsedThisMonth = user.AnalysisUsedThisMonth,
                    RemainingAnalyses = user.MonthlyAnalysisQuota - user.AnalysisUsedThisMonth
                }
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "Logged out successfully" });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                    return Unauthorized();

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return NotFound();

                user.FirstName = dto.FirstName;
                user.LastName = dto.LastName;
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                    return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

                _logger.LogInformation("User profile updated: {Email}", user.Email);

                var profileRoles = await _userManager.GetRolesAsync(user);

                return Ok(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = profileRoles.FirstOrDefault() ?? "user",
                    SubscriptionTier = user.SubscriptionTier,
                    MonthlyAnalysisQuota = user.MonthlyAnalysisQuota,
                    AnalysisUsedThisMonth = user.AnalysisUsedThisMonth,
                    RemainingAnalyses = user.MonthlyAnalysisQuota - user.AnalysisUsedThisMonth
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile");
                return StatusCode(500, new { message = "Failed to update profile" });
            }
        }
    }
}
