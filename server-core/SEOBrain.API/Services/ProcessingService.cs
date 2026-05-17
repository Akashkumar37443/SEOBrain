using System.Text.Json;
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
                
                var response = await _httpClient.PostAsJsonAsync($"{aiServiceUrl}/v1/analyze", request);
                
                if (!response.IsSuccessStatusCode)
                {
                    throw new HttpRequestException($"AI service returned status code: {response.StatusCode}");
                }

                var jsonStr = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonStr);
                var root = doc.RootElement;

                var result = new AIAnalysisResponseDto();

                if (root.TryGetProperty("score", out var scoreProp) && scoreProp.TryGetInt32(out var s))
                {
                    result.SeoScore = s;
                }
                else if (root.TryGetProperty("Score", out var scoreProp2) && scoreProp2.TryGetInt32(out var s2))
                {
                    result.SeoScore = s2;
                }

                if (root.TryGetProperty("suggestions", out var suggProp) && suggProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in suggProp.EnumerateArray())
                    {
                        if (elem.ValueKind == JsonValueKind.String)
                        {
                            result.Suggestions.Add(elem.GetString() ?? "");
                        }
                    }
                }
                else if (root.TryGetProperty("Suggestions", out var suggProp2) && suggProp2.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in suggProp2.EnumerateArray())
                    {
                        if (elem.ValueKind == JsonValueKind.String)
                        {
                            result.Suggestions.Add(elem.GetString() ?? "");
                        }
                    }
                }

                if (result.Suggestions.Count == 0)
                {
                    if (root.TryGetProperty("summary", out var sumProp) && sumProp.ValueKind == JsonValueKind.String)
                    {
                        result.Suggestions.Add(sumProp.GetString() ?? "Content optimized.");
                    }
                    else
                    {
                        result.Suggestions.Add("Content successfully processed by SEOBrain AI Engine.");
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                return new AIAnalysisResponseDto 
                { 
                    Suggestions = new List<string> { $"Error: {ex.Message}" },
                    SeoScore = 50,
                    Keywords = new List<object>()
                };
            }
        }
    }
}
