using System.Text.Json;
using SEOBrain.API.DTOs;

namespace SEOBrain.API.Services
{
    public interface IAIService
    {
        Task<AiAnalyzeResponseDto> AnalyzeAsync(string text);
    }

    public class AIService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public AIService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<AiAnalyzeResponseDto> AnalyzeAsync(string text)
        {
            var aiBaseUrl = _configuration["AiServiceUrl"] ?? "http://localhost:8000";

            var request = new AiAnalyzeRequestDto { Text = text };

            var response = await _httpClient.PostAsJsonAsync($"{aiBaseUrl}/v1/analyze", request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"AI service returned {(int)response.StatusCode} {response.ReasonPhrase}. Body: {body}");
            }

            var result = await response.Content.ReadFromJsonAsync<AiAnalyzeResponseDto>();

            if (result == null)
            {
                throw new JsonException("AI service returned an invalid payload");
            }

            return result;
        }
    }
}
