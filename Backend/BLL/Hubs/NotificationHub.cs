using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BLL.Hubs
{
    /// <summary>
    /// Single notification hub for everything that should hit a user in real time:
    /// - admin broadcasts (Tourists / Guides / All groups)
    /// - booking lifecycle events (per-user groups: user:{userId})
    ///
    /// Per-user groups let the backend push a specific tourist or guide without
    /// hitting any other connection.
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        public static string UserGroup(string userId) => $"user:{userId}";

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
            }

            if (Context.User?.IsInRole("Tourist") == true)
                await Groups.AddToGroupAsync(Context.ConnectionId, "Tourists");
            else if (Context.User?.IsInRole("Guide") == true)
                await Groups.AddToGroupAsync(Context.ConnectionId, "Guides");
            else if (Context.User?.IsInRole("Admin") == true)
                await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId));
            }
            await base.OnDisconnectedAsync(exception);
        }

        // Kept for backwards compatibility with older clients that explicitly invoke it.
        // Re-joining groups is idempotent in SignalR so this is safe.
        public async Task JoinMyGroup()
        {
            await OnConnectedAsync();
        }
    }
}
