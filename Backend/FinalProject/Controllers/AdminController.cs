using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // 1. List guides awaiting approval
        [HttpGet("pending-guides")]
        public async Task<IActionResult> GetPendingGuides()
        {
            var guides = await _adminService.GetPendingGuidesAsync();
            return Ok(new { IsSuccess = true, Data = guides });
        }

        // 2. Approve a pending guide
        [HttpPut("guides/{guideId}/approve")]
        public async Task<IActionResult> ApproveGuide(string guideId)
        {
            try
            {
                await _adminService.ApproveGuideAsync(guideId);
                return Ok(new { IsSuccess = true, Message = "Guide approved and activated." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
        }

        // 3. Reject a pending guide
        [HttpDelete("guides/{guideId}/reject")]
        public async Task<IActionResult> RejectGuide(string guideId)
        {
            try
            {
                await _adminService.RejectGuideAsync(guideId);
                return Ok(new { IsSuccess = true, Message = "Guide application rejected and removed." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpGet("reviews")]
        public async Task<IActionResult> GetAllReviews()
        {
            var reviews = await _adminService.GetAllReviewsForModerationAsync();
            return Ok(new { IsSuccess = true, Data = reviews });
        }

        [HttpDelete("reviews/{id}")]
        public async Task<IActionResult> DeleteReview(Guid id)
        {
            var result = await _adminService.DeleteReviewAsync(id);
            if (result)
                return Ok(new { IsSuccess = true, Message = "Review deleted successfully." });

            return NotFound(new { IsSuccess = false, Message = "Review not found." });
        }

        [HttpGet("stories")]
        public async Task<IActionResult> GetAllStories()
        {
            var stories = await _adminService.GetAllStoriesForModerationAsync();
            return Ok(new { IsSuccess = true, Data = stories });
        }

        [HttpDelete("stories/{id}")]
        public async Task<IActionResult> DeleteStory(Guid id)
        {
            var result = await _adminService.DeleteStoryAsync(id);
            if (result)
                return Ok(new { IsSuccess = true, Message = "Story deleted successfully." });

            return NotFound(new { IsSuccess = false, Message = "Story not found." });
        }

        [HttpPatch("users/{userId}/toggle-ban")]
        public async Task<IActionResult> ToggleUserBan(string userId)
        {
            try
            {
                var resultMessage = await _adminService.ToggleUserBanStatusAsync(userId);
                return Ok(new { IsSuccess = true, Message = resultMessage });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _adminService.GetAllUsersAsync();
            return Ok(new { IsSuccess = true, Data = users });
        }

        [HttpDelete("users/{userId}/delete")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            try
            {
                var message = await _adminService.DeleteUserPermanentlyAsync(userId);
                return Ok(new { IsSuccess = true, Message = message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboard()
        {
            var data = await _adminService.GetDashboardStatsAsync();
            return Ok(new { IsSuccess = true, Data = data });
        }

        [HttpGet("users/{id}/status")]
        public async Task<IActionResult> GetUserStatus(string id)
        {
            var result = await _adminService.GetUserStatusAsync(id);
            if (result == null) return NotFound(new { IsSuccess = false, Message = "User not found." });
            return Ok(new { IsSuccess = true, Data = result });
        }
    }
}
