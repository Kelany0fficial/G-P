using BLL.Service.Abstraction;
using DAL.Entity;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BLL.Service.Implementation
{
    public class GuideService : IGuideService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileService _fileService;
        public readonly IStoryService _storyService;

        public GuideService(IUnitOfWork unitOfWork, IFileService fileService, IStoryService storyService)
        {
            _unitOfWork = unitOfWork;
            _fileService = fileService;
            _storyService = storyService;
        }

        public async Task<IEnumerable<GuideDisplayDto>> GetActiveGuidesAsync()
        {
            var allGuides = await _unitOfWork.TourGuides.FindAsyncInclude(
                g => g.State == true && !g.IsSuspended,
                g => g.User);

            return allGuides.Select(g => new GuideDisplayDto
            {
                GuideId = g.GuideId,
                Name = g.User?.UserName ?? "Unknown",
                ProfileImageUrl = g.User?.UrlProfile,
                PriceOfDay = g.PriceOfDay,
                Language = g.Language ?? string.Empty,
                Languages = string.IsNullOrWhiteSpace(g.Language)
                    ? new List<string>()
                    : g.Language.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList(),
                Rate = g.Rate
            }).ToList();
        }

        public async Task<GuideDetailsDto> GetGuideByIdAsync(string guideId)
        {
            var guide = await _unitOfWork.TourGuides.GetByIdWithIncludesAsync(
                g => g.GuideId == guideId,
                g => g.User);

            if (guide == null || guide.IsSuspended || !guide.State)
                throw new KeyNotFoundException("Guide is not available.");

            var allReviews = await _unitOfWork.Reviews.FindAsyncInclude(
                r => r.GuideId == guideId,
                r => r.Tourist!.User!);

            var allBookings = await _unitOfWork.Bookings.FindAsync(b => b.GuideId == guideId && b.State == "Completed");

            return new GuideDetailsDto
            {
                GuideId = guide.GuideId,
                Name = guide.User?.UserName ?? "Unknown",
                ProfileImageUrl = guide.User?.UrlProfile,
                PriceOfDay = guide.PriceOfDay,
                Language = guide.Language ?? string.Empty,
                Languages = string.IsNullOrWhiteSpace(guide.Language)
                    ? new List<string>()
                    : guide.Language.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList(),
                Rate = guide.Rate,
                Bio = guide.Bio ?? string.Empty,
                CompletedToursCount = allBookings.Count(),
                Reviews = allReviews.Select(r => new GuideReviewDto
                {
                    TouristName = r.Tourist?.User?.UserName ?? "Tourist",
                    Rate = r.Rate,
                    Comment = r.Comment
                }).ToList()
            };
        }

        // Update guide profile (bio, languages, price)
        public async Task<bool> UpdateGuideProfileAsync(string guideId, UpdateGuideProfileDto dto)
        {
            var guide = await _unitOfWork.TourGuides.GetByIdAsStringAsync(guideId);
            if (guide == null) return false;

            // ResolveLanguageCsv() collapses Languages[] into a CSV string for the single DB column.
            guide.UpdateInfo(dto.Bio, dto.ResolveLanguageCsv(), dto.PriceOfDay);

            _unitOfWork.TourGuides.Update(guide);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        // View wallet + debt
        public async Task<GuideWalletDto> GetGuideWalletAsync(string guideId)
        {
            var guide = await _unitOfWork.TourGuides.GetByIdAsStringAsync(guideId);
            if (guide == null) throw new KeyNotFoundException("Guide not found.");

            var allBookings = await _unitOfWork.Bookings.FindAsync(b => b.GuideId == guideId && b.State == "Completed");

            return new GuideWalletDto
            {
                OutstandingBalance = guide.OutstandingBalance,
                WalletBalance = guide.WalletBalance,
                CompletedTours = allBookings.Count(),
                CancellationStrikes = guide.CancellationStrikes,
                IsSuspended = guide.IsSuspended
            };
        }

        public async Task<GuideDetailsDto> GetMyProfileAsync(string guideId)
        {
            var guideList = await _unitOfWork.TourGuides.FindAsyncInclude(
                g => g.GuideId == guideId,
                q => q.Include(g => g.User)
                      .Include(g => g.Bookings)
                      .Include(g => g.Reviews)
                          .ThenInclude(r => r.Tourist!).ThenInclude(t => t!.User));

            var guide = guideList.FirstOrDefault();
            if (guide == null) throw new KeyNotFoundException("Guide not found.");

            var myStories = await _storyService.GetUserStoriesAsync(guideId, guideId);

            return new GuideDetailsDto
            {
                GuideId = guide.GuideId,
                Name = guide.User?.UserName ?? "Unknown",
                ProfileImageUrl = guide.User?.UrlProfile,
                PriceOfDay = guide.PriceOfDay,
                Language = guide.Language ?? string.Empty,
                Languages = string.IsNullOrWhiteSpace(guide.Language)
                    ? new List<string>()
                    : guide.Language.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList(),
                Rate = guide.Rate,
                Bio = guide.Bio ?? string.Empty,
                ActiveStories = myStories.ToList(),
                CompletedToursCount = guide.Bookings.Count(b => b.State == "Completed"),
                WalletBalance = guide.WalletBalance,
                Reviews = guide.Reviews
                    .Where(r => r.ReviewType == "TouristToGuide")
                    .Select(r => new GuideReviewDto
                    {
                        TouristName = r.Tourist?.User?.UserName ?? "Tourist",
                        Rate = r.Rate,
                        Comment = r.Comment
                    }).ToList()
            };
        }

        public async Task<string> UpdateProfileImageAsync(string guideId, IFormFile profileImage)
        {
            if (profileImage == null || profileImage.Length == 0)
                throw new ArgumentException("No image was provided for upload.");

            var guide = await _unitOfWork.TourGuides.GetByIdWithIncludesAsync(
                g => g.GuideId == guideId,
                g => g.User);

            if (guide == null)
                throw new KeyNotFoundException("User not found.");

            if (!string.IsNullOrEmpty(guide.User?.UrlProfile))
            {
                try { _fileService.DeleteFile(guide.User.UrlProfile); } catch { /* non-fatal */ }
            }

            string newImageUrl = await _fileService.UploadFileAsync(profileImage, "Files/images/profiles");
            guide.User!.UpdateurlProfile(newImageUrl);

            _unitOfWork.TourGuides.Update(guide);
            await _unitOfWork.CompleteAsync();

            return newImageUrl;
        }
    }
}
