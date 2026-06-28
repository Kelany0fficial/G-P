using System.Security.Claims;
using DAL.Repo.Abstraction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BLL.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IUnitOfWork _unitOfWork;

        public ChatHub(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task JoinChatRoom(string bookingId)
        {
            if (!Guid.TryParse(bookingId, out var bookingGuid))
                throw new HubException("Invalid bookingId.");

            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new HubException("Unauthenticated.");

            var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingGuid);
            if (booking == null || (booking.TouristId != userId && booking.GuideId != userId))
                throw new HubException("You are not a participant in this booking.");

            await Groups.AddToGroupAsync(Context.ConnectionId, bookingId);
        }

        public async Task LeaveChatRoom(string bookingId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, bookingId);
        }
    }
}
