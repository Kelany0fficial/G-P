using BLL.ModelVm.AiPlane;
using BLL.ModelVm.Manual;
using BLL.Service.Abstraction;
using FinalProject.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Tourist")]
    public class PlansController : ControllerBase
    {
        private readonly IPlanService _planService;

        public PlansController(IPlanService planService)
        {
            _planService = planService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePlan([FromBody] CreatePlanDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var planId = await _planService.CreateAndSavePlanAsync(dto, touristId);
                return StatusCode(StatusCodes.Status201Created,
                    new { IsSuccess = true, Message = "AI plan generated.", PlanId = planId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpPost("manual-generate")]
        public async Task<IActionResult> CreateManual([FromBody] CreateManualPlanDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            if (dto.StartDate.Date < DateTime.UtcNow.Date)
                return BadRequest(new { IsSuccess = false, Message = "Plan start date cannot be in the past." });

            try
            {
                var planId = await _planService.CreateManualPlanAsync(dto, touristId);
                return StatusCode(StatusCodes.Status201Created,
                    new { IsSuccess = true, Message = "Manual plan saved.", PlanId = planId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpGet("ai-plan-details/{planId}")]
        public async Task<IActionResult> GetAiPlanDetails(Guid planId)
        {
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var planDetails = await _planService.GetAiPlanDetailsAsync(planId, touristId);
                if (planDetails == null)
                    return NotFound(new { IsSuccess = false, Message = "Plan not found." });
                return Ok(new { IsSuccess = true, Data = planDetails });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }
    }
}
