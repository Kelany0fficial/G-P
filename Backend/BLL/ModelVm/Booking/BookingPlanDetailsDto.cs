using System;
using System.Collections.Generic;

namespace BLL.ModelVm.Booking
{
    public class BookingPlanDetailsDto
    {
        public string PlanName { get; set; } = string.Empty;
        public string PlanType { get; set; } = string.Empty; // "AI" or "Manual"
        public int TotalDays { get; set; }

        // Manual plans
        public DateTime? StartDate { get; set; }
        public List<DailyPlanItemDto> ManualPlanItems { get; set; } = new List<DailyPlanItemDto>();

        // AI plans (raw JSON, the frontend parses)
        public string? AiResponseJson { get; set; }
    }

    public class DailyPlanItemDto
    {
        public int DayNumber { get; set; }
        public string PlaceName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public Guid? PlaceId { get; set; }
    }
}
