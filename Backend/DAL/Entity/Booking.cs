

namespace DAL.Entity
{
    public class Booking
    {
        public Guid Id { get; private set; }



        [Required]
        [ForeignKey("Tourist")]
        public string TouristId { get; private set; }
        public virtual Tourist Tourist { get; private set; }



        [Required]
        [ForeignKey("TourGuide")]
        public string GuideId { get; private set; }
        public virtual TourGuide Guide { get; private set; } // تأكد إن كلاس TourGuide موجود عندك



        // --- الإضافة الجديدة: ربط الحجز بالخطة (واحدة منهم هتكون بـ null والتانية فيها داتا) ---
        public Guid? AiPlanId { get; private set; }
        [ForeignKey("AiPlanId")]
        public virtual AiPlan AiPlan { get; private set; }



        public Guid? ManualPlanId { get; private set; }
        [ForeignKey("ManualPlanId")]
        public virtual ManualPlan ManualPlan { get; private set; }
        // --------------------------------------------------------------------------------

        public Guid? ChatMessageId { get; private set; }
        [ForeignKey("ChatMessageId")]
        public virtual ChatMessage ChatMessage { get; private set; }

        [Required]
        public decimal TotalPrice { get; private set; }



        public decimal CommissionPercentage { get; private set; } = 0.05m;
        public decimal CommissionAmount { get; private set; }
        public bool IsDealDone { get; private set; } = false;



        [Required, StringLength(50)]
        public string State { get; private set; } = "Pending";



        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;



        protected Booking() { }



        // تعديل الكونستركتور عشان يستقبل الـ Plan ID
        public Booking(string touristId, string guideId, decimal totalPrice, Guid? aiPlanId = null, Guid? manualPlanId = null)
        {
            if (aiPlanId == null && manualPlanId == null)
                throw new ArgumentException("يجب اختيار خطة رحلة واحدة على الأقل (AI أو يدوية)");



            Id = Guid.NewGuid();
            TouristId = touristId;
            GuideId = guideId;
            TotalPrice = totalPrice;
            AiPlanId = aiPlanId;
            ManualPlanId = manualPlanId;
        }



        // بيزنس لوجيك: قبول الحجز وحساب العمولة
        public void AcceptBooking()
        {
            if (State != "Pending")
                throw new InvalidOperationException("Booking can only be accepted if it is currently pending.");



            State = "Accepted";
            CommissionAmount = TotalPrice * CommissionPercentage;
        }



        // بيزنس لوجيك: إتمام الرحلة
        public void CompleteBooking()
        {
            if (State != "Accepted")
                throw new InvalidOperationException("Only accepted bookings can be marked as completed.");



            State = "Completed";
            IsDealDone = true;
        }



        // بيزنس لوجيك: إلغاء الرحلة
        public void CancelBooking()
        {
            State = "Cancelled";
        }
        public void RejectBooking()
        {
            State = "Rejected";
        }
    }
}
