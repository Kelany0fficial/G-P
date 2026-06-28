using DAL.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class AppNotification
    {
        public Guid Id { get; private set; }

        [Required, StringLength(100)]
        public string Title { get; private set; }

        [Required, StringLength(500)]
        public string Message { get; private set; }

        public NotificationTarget Target { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public bool IsRead { get; set; } // للاستخدام المستقبلي لو عايز تعمل Inbox لكل يوزر



        protected AppNotification() { }



        public AppNotification(string title, string message, NotificationTarget target)
        {
            Id = Guid.NewGuid();
            Title = title;
            Message = message;
            Target = target;
            CreatedAt = DateTime.UtcNow;
            IsRead = false;
        }
    }
}
