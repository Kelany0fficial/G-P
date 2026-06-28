using BLL.ModelVm.AiPlane;
using System.Net.Http.Json;
using System.Text.Json;

namespace BLL.Service.Implementation
{
    public class AiIntegrationService : IAiIntegrationService
    {
        private readonly HttpClient _httpClient;
        private readonly IUnitOfWork _unitOfWork;



        public AiIntegrationService(HttpClient httpClient, IUnitOfWork unitOfWork)
        {
            _httpClient = httpClient;
            _unitOfWork = unitOfWork;
        }

        #region Correct
        //الدالة دي مقفولة لحد ما تيم البايثون يخلص
        public async Task<string> GetPlanFromPythonApi(int days, decimal budget, string type, string Governorate)
        {
            var requestData = new { governorate = Governorate, budget_egp = (int)budget, duration_days = days, interests = new[] { type } };
            try
            {
                var pythonApiUrl = "https://osama152-athar-tourism-api.hf.space/recommend";
                var response = await _httpClient.PostAsJsonAsync(pythonApiUrl, requestData);

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
                throw new Exception($"Error calling Python API: {ex.Message}");
            }
        }
    }
}


#endregion

//#region Fake (Mocking)
//public async Task<string> GetPlanFromPythonApi(int days, decimal budget, string type)
//{
//    // 🚨 غير الـ GUIDs دي وحط IDs حقيقية من جدول الأماكن (Places) اللي عندك في الـ SQL
//    // عشان الفرونت إند يلاقي داتا يعرضها
//    string fakePythonResponse = @"[
//    { ""day"": 1, ""place_id"": 8 },
//    { ""day"": 2, ""place_id"": 9}

//]";

//    return await Task.FromResult(fakePythonResponse);
//}
//#endregion



