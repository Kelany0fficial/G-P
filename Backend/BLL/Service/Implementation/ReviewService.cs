using BLL.ModelVm.Booking.DAL.DTOs.Reviews;
using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
        public class ReviewService : IReviewService
        {
            private readonly IUnitOfWork _unitOfWork;



            public ReviewService(IUnitOfWork unitOfWork)
            {
                _unitOfWork = unitOfWork;
            }



            public async Task<bool> AddBookingReviewAsync(string userId, string userRole, CreateBookingReviewDto dto)
            {
                var booking = await _unitOfWork.Bookings.GetByIdAsync(dto.BookingId);

                if (booking == null) throw new Exception("الحجز غير موجود.");
                if (booking.State != "Completed") throw new Exception("لا يمكن التقييم إلا بعد انتهاء الرحلة.");

                bool isByTourist = userRole == "Tourist";

                // التأكد إن اليوزر ده طرف في الرحلة أصلاً
                if (isByTourist && booking.TouristId != userId) throw new Exception("غير مصرح لك بتقييم هذه الرحلة.");
                if (!isByTourist && booking.GuideId != userId) throw new Exception("غير مصرح لك بتقييم هذه الرحلة.");

                // التأكد إنه مقيمش نفس الرحلة قبل كده
                var existingReview = await _unitOfWork.Reviews.FindAsync(r =>
                 r.BookingId == dto.BookingId &&
                 ((isByTourist && r.ReviewType == "TouristToGuide") || (!isByTourist && r.ReviewType == "GuideToTourist")));

                if (existingReview.Any()) throw new Exception("لقد قمت بتقييم هذه الرحلة مسبقاً.");

                // إنشاء التقييم باستخدام الكونستركتور اللي عملناه
                var review = new Review(
                 dto.BookingId,
                  booking.TouristId,
              booking.GuideId,
                  dto.Rate,
                 dto.Comment,
               isByTourist
                );


                await _unitOfWork.Reviews.AddAsync(review);


            // ==========================================
            // تحديث متوسط تقييم المرشد لو السائح هو اللي بيقيم
            // ==========================================
            if (isByTourist)
            {
                var guide = await _unitOfWork.TourGuides.GetByIdAsStringAsync(booking.GuideId);
                var guideReviews = await _unitOfWork.Reviews.FindAsync(r => r.GuideId == booking.GuideId && r.ReviewType == "TouristToGuide");
                int totalRates = guideReviews.Sum(r => r.Rate) + dto.Rate;
                float newAverage = (float)totalRates / (guideReviews.Count() + 1);
                guide.UpdateAverageRate(newAverage);
                _unitOfWork.TourGuides.Update(guide);
            }
            // ==========================================
            // تحديث متوسط تقييم السائح لو المرشد هو اللي بيقيم
            // ==========================================
            else
            {
                var tourist = await _unitOfWork.Tourists.GetByIdAsStringAsync(booking.TouristId); // تأكد من اسم دالة الجلب
                var touristReviews = await _unitOfWork.Reviews.FindAsync(r => r.TouristId == booking.TouristId && r.ReviewType == "GuideToTourist");

                int totalRates = touristReviews.Sum(r => r.Rate) + dto.Rate;
                float newAverage = (float)totalRates / (touristReviews.Count() + 1);

                tourist.UpdateAverageRate(newAverage);
                _unitOfWork.Tourists.Update(tourist);
            }



            await _unitOfWork.CompleteAsync();
            return true;


        }



        public async Task<bool> AddPlaceReviewAsync(string touristId, CreatePlaceReviewDto dto)
            {
                var place = await _unitOfWork.Places.GetByIdAsync(dto.PlaceId);
                if (place == null) throw new Exception("المكان غير موجود.");



                var review = new Review(touristId, dto.PlaceId, dto.Rate, dto.Comment);

                await _unitOfWork.Reviews.AddAsync(review);
                await _unitOfWork.CompleteAsync();

                return true;
            }



            public async Task<IEnumerable<ReviewDisplayDto>> GetGuideReviewsAsync(string guideId)
            {
                var reviews = await _unitOfWork.Reviews.FindAsyncInclude(
                r => r.GuideId == guideId && r.ReviewType == "TouristToGuide",
                r => r.Tourist.User // Eager Loading للسائح واليوزر بتاعه
                           );



                return reviews.Select(r => new ReviewDisplayDto
                {
                    ReviewerName = r.Tourist?.User?.UserName ?? "سائح غير معروف",
                    ReviewerImageUrl = r.Tourist?.User?.UrlProfile,
                    Rate = r.Rate,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                }).OrderByDescending(r => r.CreatedAt).ToList();
            }

        public async Task<IEnumerable<ReviewDisplayDto>> GetTouristReviewsAsync(string touristId)
        {
            // بنجيب كل الريفيوهات المكتوبة على السائح (من المرشدين)
            var reviews = await _unitOfWork.Reviews.FindAsyncInclude(
 r => r.TouristId == touristId && r.ReviewType == "GuideToTourist",
 r => r.Guide.User // عشان نجيب اسم المرشد اللي كتب التقييم
            );



            return reviews.Select(r => new ReviewDisplayDto
            {
                ReviewerName = r.Guide?.User?.UserName ?? "مرشد غير معروف",
                ReviewerImageUrl = r.Guide?.User?.UrlProfile,
                Rate = r.Rate,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).OrderByDescending(r => r.CreatedAt).ToList();
        }
    }
    }


