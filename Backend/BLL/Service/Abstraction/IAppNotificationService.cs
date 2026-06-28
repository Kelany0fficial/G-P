using BLL.ModelVm.Notif;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IAppNotificationService
    {
        Task<bool> MarkAsReadAsync(Guid notificationId);
        Task<bool> MarkAllAsReadAsync(string userId);
        Task<bool> SendBroadcastNotificationAsync(SendNotificationDto dto);
        Task<IEnumerable<NotificationDisplayDto>> GetNotificationsForUserAsync(string userId); // 🚨 الدالة الجديدة
    }
}
