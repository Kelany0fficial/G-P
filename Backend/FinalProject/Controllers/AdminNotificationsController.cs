using BLL.Hubs;
using BLL.ModelVm.Notif;

using Microsoft.AspNetCore.SignalR;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminNotificationsController : ControllerBase
    {
        private readonly IAppNotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public AdminNotificationsController(IAppNotificationService notificationService, IHubContext<NotificationHub> hubContext)
        {
            _notificationService = notificationService;
            _hubContext = hubContext;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("send")]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _notificationService.SendBroadcastNotificationAsync(dto);

            if (result)
                return Ok(new { IsSuccess = true, Message = "Notification sent successfully to the target audience." });

            return BadRequest(new { IsSuccess = false, Message = "Failed to send notification." });
        }

        [HttpGet("my-notifications")]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { IsSuccess = false, Message = "User not authenticated." });

            try
            {
                var notifications = await _notificationService.GetNotificationsForUserAsync(userId);
                return Ok(new { IsSuccess = true, Data = notifications });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpPatch("{id}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var result = await _notificationService.MarkAsReadAsync(id);
            if (result)
                return Ok(new { IsSuccess = true, Message = "Notification marked as read." });

            return NotFound(new { IsSuccess = false, Message = "Notification not found." });
        }

        [HttpPatch("mark-all-as-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { IsSuccess = false, Message = "User not authenticated." });

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(new { IsSuccess = true, Message = "All notifications marked as read." });
        }
    }
}
