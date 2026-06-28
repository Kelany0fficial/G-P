namespace BLL.ModelVm.Manual
{
    public class CreateManualPlanDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        // شيلنا NumberOfDays الإجبارية عشان السائح حر يحط الأيام اللي هو عايزها براحته
        [Required]
        public List<ManualPlanItemDto> SelectedPlaces { get; set; } = new List<ManualPlanItemDto>();
    }



    public class ManualPlanItemDto
    {
        [Required]
        public Guid PlaceId { get; set; }

        [Required]
        [Range(1, 30)] // رقم يوم الفسحة (مثلاً: 1 يعني اليوم الأول من الخطة)
        public int DayNumber { get; set; }
    }
}
