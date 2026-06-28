using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Story
{
    // 1. DTO لإنشاء الاستوري (هيتبعت كـ FormData عشان فيه ملف)
    public class CreateStoryDto
    {
        [Required(ErrorMessage = "المدينة مطلوبة")]
        [StringLength(100)]
        public string City { get; set; }



        [MaxLength(300)]
        public string Description { get; set; }



        [Required(ErrorMessage = "الملف (صورة أو فيديو) مطلوب")]
        public IFormFile MediaFile { get; set; }
    }



    // 2. DTO لعرض الاستوري
    public class StoryDisplayDto
    {
        public Guid StoryId { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string UserProfileImage { get; set; }

        // ضفنا الحقول بتاعتك هنا
        public string City { get; set; }
        public string Description { get; set; }

        public string MediaUrl { get; set; }
        public string MediaType { get; set; }
        public DateTime CreatedAt { get; set; }

        public int ViewsCount { get; set; }
        public int LovesCount { get; set; }
        public bool IsLovedByMe { get; set; }
    }
}

