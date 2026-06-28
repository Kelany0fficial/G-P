using BLL.Hubs;
using BLL.ModelVm.Notif;
using DAL.Entity;
using DAL.Enum;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class AppNotificationService : IAppNotificationService
    {
        private readonly IUnitOfWork _unitOfWork;
       
        private readonly IHubContext<NotificationHub> _hubContext;// 🚨 حقن Signalr
        private readonly UserManager<AppUser> _userManager;



        public AppNotificationService(IUnitOfWork unitOfWork, IHubContext<NotificationHub> hubContext, UserManager<AppUser> userManager)
        {
            _unitOfWork = unitOfWork;
            _hubContext = hubContext;
            _userManager = userManager;
        }



        public async Task<bool> SendBroadcastNotificationAsync(SendNotificationDto dto)
        {
            var notification = new AppNotification(dto.Title, dto.Message, dto.Target);
            await _unitOfWork.AppNotifications.AddAsync(notification);
            await _unitOfWork.CompleteAsync();



            // 🚨 1. تحويل التاريخ لنص عشان نمنع أي إيرور صامت في الـ JSON
            var liveData = new
            {
                title = dto.Title,
                message = dto.Message,
                createdAt = notification.CreatedAt.ToString("yyyy-MM-dd hh:mm tt")
            };



            // Broadcast to the correct target group
            switch (dto.Target)
            {
                case NotificationTarget.Tourist:
                    await _hubContext.Clients.Group("Tourists").SendAsync("ReceiveNotification", liveData);
                    break;
                case NotificationTarget.Guide:
                    await _hubContext.Clients.Group("Guides").SendAsync("ReceiveNotification", liveData);
                    break;
                case NotificationTarget.All:
                    await _hubContext.Clients.All.SendAsync("ReceiveNotification", liveData);
                    break;
            }

            return true;
        }
        public async Task<IEnumerable<NotificationDisplayDto>> GetNotificationsForUserAsync(string userId)
        {
            // 1. هنجيب بيانات اليوزر عشان نعرف الـ Role بتاعه
            var user = await _unitOfWork.Users.GetByIdAsStringAsync(userId); // افترضنا وجود Users في الـ UnitOfWork

            // 2. تحديد الـ Target المناسب لليوزر
            NotificationTarget userTarget = NotificationTarget.All;

            if (await _userManager.IsInRoleAsync(user, "Tourist"))
                userTarget = NotificationTarget.Tourist;
            else if (await _userManager.IsInRoleAsync(user, "Guide"))
                userTarget = NotificationTarget.Guide;

            // 3. نجيب الإشعارات اللي تخصه (الكل + الفئة بتاعته)
            var notifications = await _unitOfWork.AppNotifications.FindAsync(n =>
         n.Target == NotificationTarget.All || n.Target == userTarget
         );



            // 4. الترتيب من الأحدث للأقدم والتحويل لـ DTO
            return notifications
         .OrderByDescending(n => n.CreatedAt)
         .Select(n => new NotificationDisplayDto
         {
             Id = n.Id,
             Title = n.Title,
             Message = n.Message,
             CreatedAt = n.CreatedAt,
             IsRead = n.IsRead
         }).ToList();
        }
        public async Task<bool> MarkAsReadAsync(Guid notificationId)
        {
            var notification = await _unitOfWork.AppNotifications.GetByIdAsync(notificationId);
            if (notification == null) return false;



            notification.IsRead = true; // 🚨 تحويل الحالة لمقروء
            _unitOfWork.AppNotifications.Update(notification);
            await _unitOfWork.CompleteAsync();
            return true;
        }



        public async Task<bool> MarkAllAsReadAsync(string userId)
        {
            // هنجيب كل الإشعارات اللي تخص اليوزر ده ولم تُقرأ بعد
            // (هنا بنستخدم نفس الفلتر اللي استخدمناه في GetNotifications)
            var user = await _unitOfWork.Users.GetByIdAsStringAsync(userId);
            NotificationTarget userTarget = (await _userManager.IsInRoleAsync(user, "Tourist"))
            ? NotificationTarget.Tourist : NotificationTarget.Guide;



            var unreadNotifications = await _unitOfWork.AppNotifications.FindAsync(n =>
            (n.Target == NotificationTarget.All || n.Target == userTarget) && !n.IsRead);



            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }



            await _unitOfWork.CompleteAsync();
            return true;
        }
    }
}
