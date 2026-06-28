using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Booking
{
    public class MyBookingTouristBookingDisplayDto
    {
        public Guid BookingId { get; set; }
        public string PlanName { get; set; } 
        // بيانات المرشد اللي طالع معاه
        public string GuideId { get; set; }
        public string GuideName { get; set; }
        public string? GuideProfileImage { get; set; }
       

        // بيانات الحجز
        public DateTime BookingDate { get; set; } // تاريخ إنشاء الحجز
        public string State { get; set; } // Pending, Accepted, Completed, Cancelled
        public decimal TotalCost { get; set; } // التكلفة الإجمالية لو كنت حاسبها
    }
}
