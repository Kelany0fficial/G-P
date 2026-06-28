using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class Review
    {
        public Guid Id { get; private set; }



        [Required]
        public int Rate { get; private set; }



        [MaxLength(500)]
        public string Comment { get; private set; }



        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;



        // 1. إضافة رقم الحجز (إجباري لو التقييم بين مرشد وسائح لمنع التقييم الوهمي)
        [ForeignKey("Booking")]
        public Guid? BookingId { get; private set; }
        public virtual Booking? Booking { get; private set; }



        // 2. نوع التقييم عشان نحدد الاتجاه
        // هياخد قيمة من 3: "TouristToGuide" أو "GuideToTourist" أو "TouristToPlace"
        [Required]
        public string ReviewType { get; private set; }



        [ForeignKey("Tourist")]
        [Required]
        public string TouristId { get; private set; }
        public virtual Tourist Tourist { get; private set; }



        [ForeignKey("Guide")]
        public string? GuideId { get; private set; }
        public virtual TourGuide? Guide { get; private set; }



        [ForeignKey("Place")]
        public Guid? PlaceId { get; private set; }
        public virtual Place? Place { get; private set; }



        protected Review() { }



        // ==========================================
        // الكونستركتور الأول: تقييم الأشخاص لبعض (سائح لمرشد أو مرشد لسائح)
        // ==========================================
        public Review(Guid bookingId, string touristId, string guideId, int rate, string comment, bool isByTourist)
        {
            if (rate < 1 || rate > 5)
                throw new ArgumentException("Rating must be between 1 and 5.");



            Id = Guid.NewGuid();
            BookingId = bookingId;
            TouristId = touristId;
            GuideId = guideId;
            Rate = rate;
            Comment = comment;
            CreatedAt = DateTime.UtcNow;

            // لو isByTourist = true يبقى السائح بيقيم المرشد، لو false يبقى العكس
            ReviewType = isByTourist ? "TouristToGuide" : "GuideToTourist";
        }



        // ==========================================
        // الكونستركتور التاني: تقييم السائح للمكان الأثري
        // ==========================================
        public Review(string touristId, Guid placeId, int rate, string comment)
        {
            if (rate < 1 || rate > 5)
                throw new ArgumentException("Rating must be between 1 and 5.");



            Id = Guid.NewGuid();
            TouristId = touristId;
            PlaceId = placeId;
            Rate = rate;
            Comment = comment;
            ReviewType = "TouristToPlace";
            CreatedAt = DateTime.UtcNow;
        }
    }
}
