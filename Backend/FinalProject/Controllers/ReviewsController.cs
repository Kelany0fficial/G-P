using BLL.ModelVm.Booking.DAL.DTOs.Reviews;
using FinalProject.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        // Review a completed booking — Tourist or Guide on the other party
        [Authorize(Roles = "Tourist,Guide")]
        [HttpPost("booking")]
        public async Task<IActionResult> ReviewBooking([FromBody] CreateBookingReviewDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            // Resolve the most specific role from the JWT
            var userRole = User.IsInRole("Tourist") ? "Tourist"
                         : User.IsInRole("Guide") ? "Guide"
                         : string.Empty;
            if (string.IsNullOrEmpty(userRole))
                return Forbid();

            try
            {
                await _reviewService.AddBookingReviewAsync(userId, userRole, dto);
                return StatusCode(StatusCodes.Status201Created,
                    new { IsSuccess = true, Message = "Review submitted." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        // Review a place — Tourist only
        [Authorize(Roles = "Tourist")]
        [HttpPost("place")]
        public async Task<IActionResult> ReviewPlace([FromBody] CreatePlaceReviewDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                await _reviewService.AddPlaceReviewAsync(touristId, dto);
                return StatusCode(StatusCodes.Status201Created,
                    new { IsSuccess = true, Message = "Place review submitted." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        // Public — list reviews of a guide
        [HttpGet("guide/{guideId}")]
        public async Task<IActionResult> GetGuideReviews(string guideId)
        {
            var reviews = await _reviewService.GetGuideReviewsAsync(guideId);
            return Ok(new { IsSuccess = true, Data = reviews });
        }

        // Public — list reviews of a tourist
        [HttpGet("tourist/{touristId}")]
        public async Task<IActionResult> GetTouristReviews(string touristId)
        {
            var reviews = await _reviewService.GetTouristReviewsAsync(touristId);
            return Ok(new { IsSuccess = true, Data = reviews });
        }
    }
}
