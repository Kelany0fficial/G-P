using BLL.ModelVm.TouristVm;
using FinalProject.Common;
using MailKit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Tourist")]
    public class TouristsController : ControllerBase
    {
        private readonly ITouristService _touristService;
        private readonly IPlanService _planService;
        private readonly IInteractionService _interactionService;
        private readonly IAIRecommendation _aiService;

        public TouristsController(ITouristService touristService, IPlanService planService, IInteractionService interactionService, IAIRecommendation aiService)
        {
            _touristService = touristService;
            _planService = planService;
            _interactionService = interactionService;
            _aiService = aiService;
        }

        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });
            try
            {
                var profile = await _touristService.GetMyProfileAsync(touristId);
                return Ok(new { IsSuccess = true, Data = profile });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpPut("Update-my-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateTouristProfileDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var result = await _touristService.UpdateProfileAsync(touristId, dto);
            if (!result)
                return BadRequest(new { IsSuccess = false, Message = "Failed to update profile." });

            return Ok(new { IsSuccess = true, Message = "Profile updated successfully." });
        }

        [HttpPut("update-profile-image")]
        public async Task<IActionResult> UpdateProfileImage([FromForm] UpdateProfileImageTourist dto)
        {
            if (dto?.profileImage == null || dto.profileImage.Length == 0)
                return BadRequest(new { IsSuccess = false, Message = "A valid image file is required." });

            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var newImageUrl = await _touristService.UpdateProfileImageAsync(touristId, dto.profileImage);
                return Ok(new { IsSuccess = true, Message = "Profile image updated.", ImageUrl = newImageUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpGet("my-ai-plans")]
        public async Task<IActionResult> GetMyAiPlans()
        {
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });
            var plans = await _planService.GetMyAiPlansAsync(touristId);
            return Ok(new { IsSuccess = true, Data = plans });
        }

        [HttpGet("my-manual-plans")]
        public async Task<IActionResult> GetMyManualPlans()
        {
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });
            var plans = await _planService.GetMyManualPlansAsync(touristId);
            return Ok(new { IsSuccess = true, Data = plans });
        }

        [HttpGet("recommendations")]
        public async Task<IActionResult> GetRecommendations()
        {
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var interactions = await _interactionService.GetUserInteractions(touristId);

            var result = await _aiService.GetRecommendationsFromAiAsync(interactions);

            return Ok(result);
        }
    }
}
