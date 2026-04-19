using System.Net;
using System.Net.Mail;

namespace SEOBrain.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
        Task SendWelcomeEmailAsync(string to, string firstName);
        Task SendPasswordResetEmailAsync(string to, string resetLink);
        Task SendAdminNotificationAsync(string subject, string message);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = _configuration.GetValue<int>("Email:SmtpPort", 587);
            var smtpUser = _configuration["Email:SmtpUser"];
            var smtpPass = _configuration["Email:SmtpPassword"];
            var fromEmail = _configuration["Email:FromEmail"] ?? smtpUser;
            var fromName = _configuration["Email:FromName"] ?? "SEOBrain";

            if (string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
            {
                _logger.LogWarning("Email credentials not configured. Email not sent to {To}", to);
                return;
            }

            try
            {
                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(smtpUser, smtpPass)
                };

                var message = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = isHtml
                };
                message.To.Add(to);

                await client.SendMailAsync(message);
                _logger.LogInformation("Email sent successfully to {To}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}", to);
                throw;
            }
        }

        public async Task SendWelcomeEmailAsync(string to, string firstName)
        {
            var subject = "Welcome to SEOBrain!";
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #8b5cf6;'>Welcome to SEOBrain, {firstName}!</h2>
                        <p>Thank you for joining SEOBrain. Your account is now ready.</p>
                        <p>Get started by analyzing your first piece of content:</p>
                        <a href='https://seobrain.app' style='display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px;'>Start Analyzing</a>
                        <p style='margin-top: 20px; color: #666;'>If you have any questions, reply to this email.</p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(to, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(string to, string resetLink)
        {
            var subject = "Password Reset Request";
            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #8b5cf6;'>Password Reset</h2>
                        <p>You requested a password reset. Click the link below to reset your password:</p>
                        <a href='{resetLink}' style='display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px;'>Reset Password</a>
                        <p style='margin-top: 20px; color: #666;'>If you didn't request this, you can safely ignore this email.</p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(to, subject, body);
        }

        public async Task SendAdminNotificationAsync(string subject, string message)
        {
            var adminEmail = _configuration["Email:AdminEmail"];
            if (string.IsNullOrEmpty(adminEmail))
            {
                _logger.LogWarning("Admin email not configured");
                return;
            }

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #8b5cf6;'>SEOBrain Admin Notification</h2>
                        <p><strong>{subject}</strong></p>
                        <p>{message}</p>
                        <p style='color: #666;'>Time: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss UTC}</p>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(adminEmail, $"[SEOBrain] {subject}", body);
        }
    }
}
