using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Places
{
    // DTO خاص بالأدمن لإنشاء مكان أثري جديد
    public class CreatePlaceDto
    {
        public bool IsCustom { get; set; }
        public string? ExternalApiId { get; set; }
        [Required] public string Name { get; set; }
        [Required] public string Type { get; set; }
        public float Lat { get; set; }
        public int IdFromModel { get; set; } = 0;
        public float Lng { get; set; }

        // بيانات اختيارية (لو IsCustom هيتاخدوا من هنا، لو لأ هيتجابوا من الـ API أوتوماتيك)
        public string? Description { get; set; }
        public IFormFile? MainImageUrl { get; set; }
        public string? City { get; set; }
        public decimal TicketPrice { get; set; }
        public string? AffiliateLink { get; set; }
    }
}
