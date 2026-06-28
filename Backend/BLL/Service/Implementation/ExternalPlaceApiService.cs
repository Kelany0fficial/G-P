using BLL.ModelVm.Places;


namespace BLL.Service.Implementation
{
    // الكلاس ده بيمضي على العقد (IExternalPlaceApiService)
    public class MockExternalPlaceApiService : IExternalPlaceApiService
    {
        public async Task<ExternalPlaceData> GetPlaceDetailsFromExternalApiAsync(string externalApiId)
        {
            // 1. بنعمل تأخير وهمي (نص ثانية) عشان نحاكي إننا بنكلم سيرفر على النت
            await Task.Delay(200); // محاكاة لسرعة النت
            return new ExternalPlaceData
            {
                MainImageUrl = "https://images.unsplash.com/photo-1539650116574-8efeb43e2750",
                City = "القاهرة",
                TicketPrice = 150m,
                Description = "وصف جاي من جوجل للمكان الأثري العظيم.",
                OpeningHours = "متاح 24 ساعة"
            };
        }
    }
}
