using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AiChatModelController : ControllerBase
    {
        private readonly IAiIntegrationModelChat _aiIntegrationModelChat;

        public AiChatModelController(IAiIntegrationModelChat aiIntegrationModelChat)
        {
            _aiIntegrationModelChat = aiIntegrationModelChat;
        }
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AnalyzeImage(
    IFormFile file,
    [FromQuery] string lang = "ar")
        {
            var result = await _aiIntegrationModelChat
                .GetPlanFromModelChat(file, lang);

            return Ok(result);
        }
    }
}
