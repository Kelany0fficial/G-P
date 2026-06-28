using BLL.ModelVm.Booking;
using BLL.ModelVm.GuideVm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IBookingService
    {
        Task<IEnumerable<MyBookingTouristBookingDisplayDto>> GetMyBookingsAsync(string touristId);
        Task<IEnumerable<GuideBookingDisplayDto>> GetPendingBookingsForGuideAsync(string guideId);
        Task<bool> AcceptBookingAsync(Guid bookingId, string guideId);
        Task<bool> RejectBookingAsync(Guid bookingId, string guideId);

        Task<IEnumerable<GuideBookingDisplayDto>> GetGuideBookingsHistoryAsync(string guideId);
        Task<bool> CompleteBookingAsync(Guid bookingId, string guideId); // عشان ينهي الرحلة ويحسب العمولة
                                                                         // جلب كل حجوزات السائح


        // السماح للسائح بإلغاء الحجز
        Task<bool> CancelBookingByTouristAsync(Guid bookingId, string touristId);

        // Plan details for a guide (legacy — kept for back-compat)
        Task<BookingPlanDetailsDto> GetBookingPlanDetailsAsync(Guid bookingId, string guideId);

        // Plan itinerary accessible to either participant of the booking
        Task<BookingPlanDetailsDto> GetBookingItineraryAsync(Guid bookingId, string userId);

        // بتاخد الـ DTO وبتاخد الـ ID بتاع السائح اللي عامل Login
        Task<Guid> CreateBookingRequestAsync(CreateBookingDto dto, string touristId);
    }
}
