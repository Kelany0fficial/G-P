using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Booking
{
    public class CreateBookingDto
    {
        [Required(ErrorMessage = "يجب اختيار المرشد السياحي")]
        public string GuideId { get; set; } // الـ ID بتاع المرشد اللي السائح اختاره



        



        // السائح هيبعت واحد من الاتنين دول بس بناءً على خطته
        public Guid? AiPlanId { get; set; }
        public Guid? ManualPlanId { get; set; }
    }
}
