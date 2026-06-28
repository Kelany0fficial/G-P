using DAL.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Notif
{
    public class SendNotificationDto
    {
        [Required(ErrorMessage = "العنوان مطلوب")]
        public string Title { get; set; }



        [Required(ErrorMessage = "نص التنبيه مطلوب")]
        public string Message { get; set; }



        [Required]
        public NotificationTarget Target { get; set; } // 0: All, 1: Tourists, 2: Guides
    }
}
