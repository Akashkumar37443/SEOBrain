using SEOBrain.API.DTOs;

namespace SEOBrain.API.Services
{
    public interface IProcessingService
    {
        Task<AIAnalysisResponseDto> AnalyzeTextAsync(string text);
    }

    public class ProcessingService : IProcessingService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ProcessingService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<AIAnalysisResponseDto> AnalyzeTextAsync(string text)
        {
            try
            {
                var aiServiceUrl = _configuration["AiServiceUrl"] ?? "http://localhost:8000";
                
                var request = new AIAnalysisRequestDto { Text = text };
                
                var response = await _httpClient.PostAsJsonAsync($"{aiServiceUrl}/analyze", request);
                
                if (!response.IsSuccessStatusCode)
                {
                    throw new HttpRequestException($"AI service returned status code: {response.StatusCode}");
                }

                var result = await response.Content.ReadFromJsonAsync<AIAnalysisResponseDto>();
                
                return result ?? new AIAnalysisResponseDto 
                { 
                    Suggestions = new List<string> { "Analysis failed" },
                    SeoScore = 0,
                    Keywords = new List<string>()
                };
            }
            catch (Exception ex)
            {
                // Return fallback response if AI service is unavailable
                return new AIAnalysisResponseDto 
                { 
                    Suggestions = new List<string> { $"Error: {ex.Message}" },
                    SeoScore = 0,
                    Keywords = new List<string>()
                };
            }
        }
    }
}
