using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace BLL.ModelVm.AiPlane
{
 // 1. الكلاس ده عشان نفك بيه الـ JSON اللي جاي من بايثون
    public class PythonAiResponseItem
    {
        [JsonPropertyName("day")] // اكتب هنا الكلمة زي ما بايثون بيبعتها بالظبط
        public int DayNumber { get; set; }

        [JsonPropertyName("place_id")] // اكتب هنا الكلمة زي ما بايثون بيبعتها بالظبط
        public int PlaceId { get; set; }
    }

    // 2. الكلاسات دي عشان نبعتها للفرونت إند فيها الداتا كاملة بالصور
    public class AiPlanDetailedDisplayDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int CountDay { get; set; }
        public decimal Budget { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<AiPlanItemDetailedDto> PlanItinerary { get; set; } = new List<AiPlanItemDetailedDto>();
    }

    public class AiPlanItemDetailedDto
    {
        public int DayNumber { get; set; }
        public int PlaceId { get; set; }
        public string PlaceName { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public decimal TicketPrice { get; set; }
    }
}
