using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class AiIntegrationModelChat : IAiIntegrationModelChat
    {
        private readonly HttpClient _httpClient;
        private readonly IUnitOfWork _unitOfWork;



        public AiIntegrationModelChat(HttpClient httpClient, IUnitOfWork unitOfWork)
        {
            _httpClient = httpClient;
            _unitOfWork = unitOfWork;
        }

        #region Correct
        //الدالة دي مقفولة لحد ما تيم البايثون يخلص
        public async Task<string> GetPlanFromModelChat(
     IFormFile file,
     string lang = "ar")
        {
            try
            {
                var pythonApiUrl =
     $"https://vip2622-ai-powered-egyptian-tourism-platform.hf.space/get-audio-guide?lang={lang}";

                using var formData = new MultipartFormDataContent();

                using var stream = file.OpenReadStream();
                using var fileContent = new StreamContent(stream);

                formData.Add(fileContent, "file", file.FileName);

                var response = await _httpClient.PostAsync(
                    pythonApiUrl,
                    formData);

                var responseText = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                    return responseText;

                throw new Exception(
                    $"Status: {response.StatusCode}\nResponse: {responseText}");
            }
            catch (Exception ex)
            {
                throw new Exception($"Error calling Python API: {ex.Message}");
            }
        }
    }
}


#endregion

