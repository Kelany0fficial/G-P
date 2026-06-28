using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Booking
{
    public class TouristBookingDisplayDto
    {
        public Guid BookingId { get; set; }
        public string GuideName { get; set; } // هنجيبها من جدول AppUser المرتبط بالمرشد
        public decimal TotalPrice { get; set; }
        public string PlanName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string BookingState { get; set; } // (Pending, Accepted, Rejected, etc.)
    }
}
