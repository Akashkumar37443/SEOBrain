using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SEOBrain.API.DTOs;
using SEOBrain.API.Models;
using Stripe;
using Stripe.BillingPortal;
using Stripe.Checkout;
using SessionCreateOptions = Stripe.Checkout.SessionCreateOptions;
using SessionService = Stripe.Checkout.SessionService;

namespace SEOBrain.API.Controllers
{
    [ApiController]
    [Route("api/subscription")]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SubscriptionController> _logger;

        public SubscriptionController(
            UserManager<User> userManager,
            IConfiguration configuration,
            ILogger<SubscriptionController> logger)
        {
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"] ?? "";
        }

        [HttpGet("tiers")]
        [AllowAnonymous]
        public IActionResult GetTiers()
        {
            var tiers = new List<SubscriptionTierDto>
            {
                new()
                {
                    Id = "free",
                    Name = "Free",
                    Description = "Perfect for trying out SEO-Brain",
                    Price = 0,
                    AnalysisQuota = 10,
                    Features = new[]
                    {
                        "10 analyses per month",
                        "Basic SEO score",
                        "Keyword detection",
                        "Readability metrics"
                    },
                    StripePriceId = null
                },
                new()
                {
                    Id = "pro",
                    Name = "Pro",
                    Description = "For professional content creators",
                    Price = 29.99m,
                    AnalysisQuota = 100,
                    Features = new[]
                    {
                        "100 analyses per month",
                        "AI-powered deep analysis",
                        "Content enhancement",
                        "Competitor insights",
                        "Priority support"
                    },
                    StripePriceId = _configuration["Stripe:PriceIds:Pro"]
                },
                new()
                {
                    Id = "enterprise",
                    Name = "Enterprise",
                    Description = "For teams and agencies",
                    Price = 99.99m,
                    AnalysisQuota = 500,
                    Features = new[]
                    {
                        "500 analyses per month",
                        "API access",
                        "Team collaboration",
                        "Custom integrations",
                        "Dedicated support",
                        "White-label option"
                    },
                    StripePriceId = _configuration["Stripe:PriceIds:Enterprise"]
                }
            };

            return Ok(tiers);
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] SubscriptionCheckoutDto dto)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized();

                if (string.IsNullOrEmpty(StripeConfiguration.ApiKey))
                    return BadRequest(new { message = "Payment system not configured. Please set up Stripe keys." });

                // Validate price ID against configured values
                var proPriceId = _configuration["Stripe:PriceIds:Pro"];
                var enterprisePriceId = _configuration["Stripe:PriceIds:Enterprise"];
                if (dto.PriceId != proPriceId && dto.PriceId != enterprisePriceId)
                    return BadRequest(new { message = "Invalid price ID. Please refresh and try again." });

                // Create Stripe customer if not exists
                if (string.IsNullOrEmpty(user.StripeCustomerId))
                {
                    var customerOptions = new CustomerCreateOptions
                    {
                        Email = user.Email,
                        Name = $"{user.FirstName} {user.LastName}"
                    };
                    var customerService = new CustomerService();
                    var customer = await customerService.CreateAsync(customerOptions);
                    user.StripeCustomerId = customer.Id;
                    await _userManager.UpdateAsync(user);
                }

                var options = new SessionCreateOptions
                {
                    Customer = user.StripeCustomerId,
                    PaymentMethodTypes = new List<string> { "card" },
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new()
                        {
                            Price = dto.PriceId,
                            Quantity = 1
                        }
                    },
                    Mode = "subscription",
                    SuccessUrl = dto.SuccessUrl + "?session_id={CHECKOUT_SESSION_ID}",
                    CancelUrl = dto.CancelUrl,
                    SubscriptionData = new SessionSubscriptionDataOptions
                    {
                        Metadata = new Dictionary<string, string>
                        {
                            { "userId", user.Id.ToString() },
                            { "tier", GetTierFromPriceId(dto.PriceId) }
                        }
                    }
                };

                var service = new SessionService();
                var session = await service.CreateAsync(options);

                return Ok(new SubscriptionResponseDto
                {
                    SessionId = session.Id,
                    Url = session.Url
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating checkout session");
                return StatusCode(500, new { message = "Failed to create checkout session" });
            }
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetSubscriptionStatus()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var remaining = user.MonthlyAnalysisQuota - user.AnalysisUsedThisMonth;
            if (remaining < 0) remaining = 0;

            return Ok(new
            {
                tier = user.SubscriptionTier,
                monthlyQuota = user.MonthlyAnalysisQuota,
                usedThisMonth = user.AnalysisUsedThisMonth,
                remaining = remaining,
                quotaResetDate = user.QuotaResetDate,
                isActive = user.IsActive
            });
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();
            var webhookSecret = _configuration["Stripe:WebhookSecret"];

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], webhookSecret);

                if (stripeEvent.Type == Events.CustomerSubscriptionUpdated ||
                    stripeEvent.Type == Events.CustomerSubscriptionCreated)
                {
                    var subscription = stripeEvent.Data.Object as Subscription;
                    if (subscription?.Metadata?.ContainsKey("userId") == true)
                    {
                        var userId = Guid.Parse(subscription.Metadata["userId"]);
                        var user = await _userManager.FindByIdAsync(userId.ToString());

                        if (user != null)
                        {
                            var tier = subscription.Metadata["tier"];
                            user.SubscriptionTier = tier;
                            user.StripeSubscriptionId = subscription.Id;
                            user.MonthlyAnalysisQuota = tier switch
                            {
                                "pro" => 100,
                                "enterprise" => 500,
                                _ => 10
                            };
                            user.QuotaResetDate = DateTime.UtcNow.AddMonths(1);

                            await _userManager.UpdateAsync(user);
                            _logger.LogInformation("Updated subscription for user {UserId} to {Tier}", userId, tier);
                        }
                    }
                }

                return Ok();
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe webhook error");
                return BadRequest();
            }
        }

        private string GetTierFromPriceId(string priceId)
        {
            var proPriceId = _configuration["Stripe:PriceIds:Pro"];
            var enterprisePriceId = _configuration["Stripe:PriceIds:Enterprise"];

            if (priceId == proPriceId) return "pro";
            if (priceId == enterprisePriceId) return "enterprise";

            return "pro";
        }
    }
}
