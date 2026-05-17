using System.Text.Json;
using SEOBrain.API.DTOs;

namespace SEOBrain.API.Services
{
    public interface IAIService
    {
        Task<AiAnalyzeResponseDto> AnalyzeAsync(string text);
        Task<AiCompetitorResponseDto> AnalyzeCompetitorAsync(AiCompetitorRequestDto request);
        Task<AiAuditResponseDto> AuditTechnicalAsync(AiAuditRequestDto request);
        Task<AiMetaSchemaResponseDto> GenerateMetaSchemaAsync(AiMetaSchemaRequestDto request);
        Task<AiKeywordClusterResponseDto> GenerateKeywordClustersAsync(AiKeywordClusterRequestDto request);
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

        private string GetAiBaseUrl()
        {
            return _configuration["AiServiceUrl"] ?? "http://localhost:8000";
        }

        public async Task<AiAnalyzeResponseDto> AnalyzeAsync(string text)
        {
            var aiBaseUrl = GetAiBaseUrl();
            var request = new AiAnalyzeRequestDto { Text = text };

            var response = await _httpClient.PostAsJsonAsync($"{aiBaseUrl}/v1/analyze", request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"AI service returned {(int)response.StatusCode} {response.ReasonPhrase}. Body: {body}");
            }

            var result = await response.Content.ReadFromJsonAsync<AiAnalyzeResponseDto>();
            return result ?? throw new JsonException("AI service returned an invalid payload");
        }

        public async Task<AiCompetitorResponseDto> AnalyzeCompetitorAsync(AiCompetitorRequestDto request)
        {
            var aiBaseUrl = GetAiBaseUrl();

            var response = await _httpClient.PostAsJsonAsync($"{aiBaseUrl}/v1/competitor-insights", request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"AI service returned {(int)response.StatusCode} {response.ReasonPhrase}. Body: {body}");
            }

            var result = await response.Content.ReadFromJsonAsync<AiCompetitorResponseDto>();
            return result ?? new AiCompetitorResponseDto();
        }

        public async Task<AiAuditResponseDto> AuditTechnicalAsync(AiAuditRequestDto request)
        {
            var aiBaseUrl = GetAiBaseUrl();

            var response = await _httpClient.PostAsJsonAsync($"{aiBaseUrl}/v1/technical-audit", request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"AI service returned {(int)response.StatusCode} {response.ReasonPhrase}. Body: {body}");
            }

            var result = await response.Content.ReadFromJsonAsync<AiAuditResponseDto>();
            return result ?? new AiAuditResponseDto();
        }

        public async Task<AiMetaSchemaResponseDto> GenerateMetaSchemaAsync(AiMetaSchemaRequestDto request)
        {
            var aiBaseUrl = GetAiBaseUrl();

            var response = await _httpClient.PostAsJsonAsync($"{aiBaseUrl}/v1/meta-schema", request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"AI service returned {(int)response.StatusCode} {response.ReasonPhrase}. Body: {body}");
            }

            var result = await response.Content.ReadFromJsonAsync<AiMetaSchemaResponseDto>();
            return result ?? new AiMetaSchemaResponseDto();
        }

        public async Task<AiKeywordClusterResponseDto> GenerateKeywordClustersAsync(AiKeywordClusterRequestDto request)
        {
            var aiBaseUrl = GetAiBaseUrl();

            var response = await _httpClient.PostAsJsonAsync($"{aiBaseUrl}/v1/keyword-cluster", request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"AI service returned {(int)response.StatusCode} {response.ReasonPhrase}. Body: {body}");
            }

            var result = await response.Content.ReadFromJsonAsync<AiKeywordClusterResponseDto>();
            return result ?? new AiKeywordClusterResponseDto();
        }
    }
}
