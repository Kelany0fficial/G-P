using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Booking
{

    using System;
    using System.ComponentModel.DataAnnotations;



    namespace DAL.DTOs.Reviews
    {
        // 1. DTO لإنشاء تقييم لرحلة (ينفع للسائح وللمرشد)
        public class CreateBookingReviewDto
        {
            [Required]
            public Guid BookingId { get; set; }



            [Required]
            [Range(1, 5, ErrorMessage = "التقييم من 1 لـ 5")]
            public int Rate { get; set; }



            [MaxLength(500)]
            public string Comment { get; set; }
        }



        // 2. DTO لإنشاء تقييم لمكان (للسائح فقط)
        public class CreatePlaceReviewDto
        {
            [Required]
            public Guid PlaceId { get; set; }



            [Required]
            [Range(1, 5)]
            public int Rate { get; set; }



            [MaxLength(500)]
            public string Comment { get; set; }
        }



        // 3. DTO لعرض التقييمات في البروفايل
        public class ReviewDisplayDto
        {
            public string ReviewerName { get; set; }
            public string? ReviewerImageUrl { get; set; }
            public int Rate { get; set; }
            public string Comment { get; set; }
            public DateTime CreatedAt { get; set; }
        }
    }

}