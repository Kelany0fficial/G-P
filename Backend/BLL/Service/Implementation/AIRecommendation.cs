using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class AIRecommendation: IAIRecommendation
    {
        private readonly HttpClient _httpClient;
        private readonly IUnitOfWork _unitOfWork;



        public AIRecommendation(HttpClient httpClient, IUnitOfWork unitOfWork)
        {
            _httpClient = httpClient;
            _unitOfWork = unitOfWork;
        }
        public async Task<string> GetRecommendationsFromAiAsync(List<UserPlaceInteraction> interactions)
        {
            var requestData = new
            {
                actions = interactions.Select(x => new
                {
                    place_id = x.Place.IdFromModel,
                    action = x.Action
                }).ToList()
            };

            try
            {
                var aiApiUrl = "https://osama152-recommended-for-you.hf.space/recommend"; // حط لينك الـ AI هنا

                var response = await _httpClient.PostAsJsonAsync(aiApiUrl, requestData);

                var responseText = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return responseText;
                }

                throw new Exception(
                    $"Status: {response.StatusCode}\nResponse: {responseText}"
                );
            }
            catch (Exception ex)
            {
                throw new Exception($"Error calling Recommendation AI: {ex.Message}");
            }
        }
    }
}
