using BLL.ModelVm.Booking.DAL.DTOs.Reviews;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IReviewService
    {
        Task<IEnumerable<ReviewDisplayDto>> GetTouristReviewsAsync(string touristId);
        // إضافة تقييم للرحلة (السائح يقيم مرشد، أو المرشد يقيم سائح)
        Task<bool> AddBookingReviewAsync(string userId, string userRole, CreateBookingReviewDto dto);

        // إضافة تقييم لمكان
        Task<bool> AddPlaceReviewAsync(string touristId, CreatePlaceReviewDto dto);



        // جلب تقييمات المرشد
        Task<IEnumerable<ReviewDisplayDto>> GetGuideReviewsAsync(string guideId);
    }
}
