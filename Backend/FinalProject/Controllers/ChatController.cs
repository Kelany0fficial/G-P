using BLL.Hubs;
using FinalProject.Common;
using Microsoft.AspNetCore.SignalR;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Tourist,Guide")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService    _chatService;
        private readonly IUnitOfWork     _unitOfWork;
        private readonly IHubContext<ChatHub>         _chatHub;
        private readonly IHubContext<NotificationHub> _notifHub;

        public ChatController(
            IChatService chatService,
            IUnitOfWork unitOfWork,
            IHubContext<ChatHub> chatHub,
            IHubContext<NotificationHub> notifHub)
        {
            _chatService = chatService;
            _unitOfWork  = unitOfWork;
            _chatHub     = chatHub;
            _notifHub    = notifHub;
        }

        [HttpGet("{bookingId}/history")]
        public async Task<IActionResult> GetChatHistory(Guid bookingId)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var history = await _chatService.GetChatHistoryAsync(bookingId, userId);
                return Ok(new { IsSuccess = true, Data = history });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpPost("{bookingId}/send")]
        public async Task<IActionResult> SendMessage(Guid bookingId, [FromBody] string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                return BadRequest(new { IsSuccess = false, Message = "Message content cannot be empty." });

            if (!User.TryGetUserId(out var senderId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var savedMessage = await _chatService.SaveMessageAsync(bookingId, senderId, content);

                // Broadcast message to everyone currently in the booking's chat room
                await _chatHub.Clients.Group(bookingId.ToString()).SendAsync("ReceiveMessage", savedMessage);

                // Also push a "NewChatMessage" notification to the OTHER participant via
                // NotificationHub so they get a badge + sound even when NOT on the chat page.
                var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
                if (booking != null)
                {
                    var recipientId = senderId == booking.TouristId
                        ? booking.GuideId
                        : booking.TouristId;

                    var preview = content.Length > 60 ? content[..60] + "…" : content;
                    await _notifHub.Clients
                        .Group(NotificationHub.UserGroup(recipientId))
                        .SendAsync("NewChatMessage", new
                        {
                            bookingId = bookingId.ToString(),
                            senderId,
                            content   = preview,
                        });
                }

                return StatusCode(StatusCodes.Status201Created, new { IsSuccess = true, Data = savedMessage });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }
    }
}
