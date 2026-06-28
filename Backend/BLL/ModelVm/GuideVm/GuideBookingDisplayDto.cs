namespace BLL.ModelVm.GuideVm
{
    public class GuideBookingDisplayDto
    {
        public Guid BookingId { get; set; }
        public string TouristName { get; set; }
        public string TouristCountry { get; set; }
        public string TouristProfileUrl { get; set; }
        // ... الحقول القديمة (BookingId, TouristName, TotalPrice, etc.)
        public float TouristRate { get; set; } // ضفنا السطر ده
        public decimal TotalPrice { get; set; }
        public string PlanName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string BookingState { get; set; }
    }
}