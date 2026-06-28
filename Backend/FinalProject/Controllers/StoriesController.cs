using BLL.ModelVm.Story;
using FinalProject.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StoriesController : ControllerBase
    {
        private readonly IStoryService _storyService;

        public StoriesController(IStoryService storyService)
        {
            _storyService = storyService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateStory([FromForm] CreateStoryDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var story = await _storyService.CreateStoryAsync(userId, dto);
                return StatusCode(StatusCodes.Status201Created, new { IsSuccess = true, Message = "Story uploaded.", Data = story });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveStories()
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var stories = await _storyService.GetActiveStoriesAsync(userId);
            return Ok(new { IsSuccess = true, Data = stories });
        }

        [HttpPost("{id}/view")]
        public async Task<IActionResult> ViewStory(Guid id)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                await _storyService.ViewStoryAsync(id, userId);
                return NoContent();
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

        [HttpPost("{id}/love")]
        public async Task<IActionResult> ToggleLoveStory(Guid id)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var isLoved = await _storyService.ToggleLoveStoryAsync(id, userId);
                return Ok(new { IsSuccess = true, IsLoved = isLoved });
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

        // Owner-only delete (admins use AdminController.DeleteStory)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStory(Guid id)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                await _storyService.DeleteStoryAsync(id, userId);
                return Ok(new { IsSuccess = true, Message = "Story deleted." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { IsSuccess = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }
    }
}
