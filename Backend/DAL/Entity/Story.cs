
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class Story
    {
        public Guid Id { get; private set; }



        // 1. التعديل هنا: خليناها UserId عشان تنفع للمرشد والسائح
        [ForeignKey("User")]
        [Required]
        public string UserId { get; private set; }
        public virtual AppUser User { get; private set; }



        // الحقول بتاعتك الجميلة زي ما هي
        [Required, StringLength(100)]
        public string City { get; private set; }



        [MaxLength(300)]
        public string Description { get; private set; }



        [Required]
        public string MediaUrl { get; private set; }



        // 2. ضفنا نوع الميديا عشان الفيديوهات
        [Required]
        public string MediaType { get; private set; }



        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;



        public DateTime ExpiresAt { get; private set; }



        // 3. شيلنا הـ LoveCount++ وربطناها بجدول التفاعلات عشان نمنع التكرار
        public virtual ICollection<StoryInteraction> Interactions { get; private set; } = new List<StoryInteraction>();



        protected Story() { }



        // الكونستركتور متحدث بالحقول الجديدة
        public Story(string userId, string city, string description, string mediaUrl, string mediaType)
        {
            Id = Guid.NewGuid();
            UserId = userId;
            City = city;
            Description = description;
            MediaUrl = mediaUrl;
            MediaType = mediaType;
            ExpiresAt = DateTime.UtcNow.AddDays(1); // بتنتهي بعد 24 ساعة زي ما إنت عامل
        }
    }
}
