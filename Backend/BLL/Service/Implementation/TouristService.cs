using BLL.ModelVm.TouristVm;
using BLL.Service.Abstraction;
using DAL.Entity;
using Microsoft.AspNetCore.Http;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class TouristService : ITouristService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileService _fileService;
        public readonly IStoryService _storyService;

        public TouristService(IUnitOfWork unitOfWork, IFileService fileService, IStoryService storyService)
        {
            _unitOfWork = unitOfWork;
            _fileService = fileService;
            _storyService = storyService;
        }

        public async Task<TouristProfileDto> GetMyProfileAsync(string touristId)
        {
            var tourist = await _unitOfWork.Tourists.GetByIdWithIncludesAsync(
                t => t.TouristId == touristId,
                t => t.User);

            if (tourist == null || tourist.User == null)
                throw new KeyNotFoundException("Tourist not found.");

            var myStories = await _storyService.GetUserStoriesAsync(touristId, touristId);

            return new TouristProfileDto
            {
                TouristId = tourist.TouristId,
                UserName = tourist.User.UserName ?? string.Empty,
                Email = tourist.User.Email ?? string.Empty,
                Country = tourist.User.Country,
                Age = tourist.User.Age,
                Gender = tourist.User.Gender.ToString(),
                Language = tourist.Language,
                Languages = string.IsNullOrWhiteSpace(tourist.Language)
                    ? new System.Collections.Generic.List<string>()
                    : tourist.Language.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                      .Select(x => x.Trim()).ToList(),
                ProfileImageUrl = tourist.User.UrlProfile,
                ActiveStories = myStories.ToList(),
                RateT = tourist.Rate
            };
        }

        public async Task<bool> UpdateProfileAsync(string touristId, UpdateTouristProfileDto dto)
        {
            var tourist = await _unitOfWork.Tourists.GetByIdWithIncludesAsync(
                t => t.TouristId == touristId,
                t => t.User);

            if (tourist == null || tourist.User == null) return false;

            // AppUser-level
            tourist.User.UserName = dto.UserName;

            // Tourist-level (domain methods)
            tourist.UpdateName(dto.UserName);
            tourist.UpdateLanguage(dto.ResolveLanguageCsv());

            _unitOfWork.Tourists.Update(tourist);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<string> UpdateProfileImageAsync(string touristId, IFormFile profileImage)
        {
            var tourist = await _unitOfWork.Tourists.GetByIdWithIncludesAsync(
                t => t.TouristId == touristId,
                t => t.User);

            if (tourist == null || tourist.User == null)
                throw new KeyNotFoundException("Tourist not found.");

            if (!string.IsNullOrEmpty(tourist.User.UrlProfile))
            {
                try { _fileService.DeleteFile(tourist.User.UrlProfile); } catch { /* non-fatal */ }
            }

            string newImageUrl = await _fileService.UploadFileAsync(profileImage, "images/profiles");
            tourist.User.UpdateurlProfile(newImageUrl);

            _unitOfWork.Tourists.Update(tourist);
            await _unitOfWork.CompleteAsync();

            return newImageUrl;
        }

     
    }
}
