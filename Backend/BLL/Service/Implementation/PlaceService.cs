using BLL.ModelVm.Places;
using BLL.Service.Abstraction;
using DAL.Entity;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BLL.Service.Implementation
{
    public class PlaceService : IPlaceService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IExternalPlaceApiService _externalApi;
        private readonly IFileService _fileService;
        private readonly IInteractionService _interactionService;

        public PlaceService(IUnitOfWork unitOfWork, IExternalPlaceApiService externalApi, IFileService fileService, IInteractionService interactionService)
        {
            _unitOfWork = unitOfWork;
            _externalApi = externalApi;
            _fileService = fileService;
            _interactionService = interactionService;

        }

        // ================== Public listing ==================

        public async Task<IEnumerable<PlaceDisplayDto>> GetAllPlacesAsync()
        {
            var places = await _unitOfWork.Places.FindAsyncInclude(
                _ => true,
                p => p.Include(x => x.Reviews)
            );

            // ✅ التعديل هنا: ضفنا OrderBy للترتيب التصاعدي بناءً على SortOrder
            return places.OrderBy(p => p.SortOrder).Select(p => new PlaceDisplayDto
            {
                Id = p.Id,
                Name = p.Name,
                Type = p.Type,
                Lat = p.Lat,
                Lng = p.Lng,
                MainImageUrl = p.MainImageUrl,
                City = p.City,
                TicketPrice = p.TicketPrice,
                IdFromModel = p.IdFromModel,
                AverageRate = (p.Reviews != null && p.Reviews.Any())
                    ? Math.Round(p.Reviews.Average(r => r.Rate), 1)
                    : 0
            }).ToList();
        }

        /// <summary>
        /// Fetches a place by EITHER the DB primary key (Manual Plan flow) or by IdFromModel (AI Plan flow).
        /// - If <paramref name="id"/> is non-empty, the DB primary key is used.
        /// - Otherwise, <paramref name="externalId"/> (IdFromModel) is used.
        /// </summary>
        public async Task<PlaceDetailsDto> GetPlaceByIdAsync(
     Guid id,
     int? externalId,
     string userId)
        {
            var hasGuid = id != Guid.Empty;
            var hasAiId = externalId.HasValue && externalId.Value > 0;

            if (!hasGuid && !hasAiId)
                throw new KeyNotFoundException("Place identifier is required.");

            var placesQuery = await _unitOfWork.Places.FindAsyncInclude(
                p => (hasGuid && p.Id == id) || (hasAiId && p.IdFromModel == externalId.Value),
                p => p.Include(x => x.Reviews)
                      .ThenInclude(r => r.Tourist)
                      .ThenInclude(t => t.User)
                      .Include(x => x.UserPhotos)
                      .ThenInclude(up => up.User)
            );

            var place = placesQuery.FirstOrDefault();

            if (place == null)
                throw new KeyNotFoundException("Place not found.");

            // سجل التفاعل
            if (!string.IsNullOrEmpty(userId))
            {
//                await _unitOfWork.UserPlaceInteractions.AddAsync(
//                    new UserPlaceInteraction
//                    (
//                         userId,
//                        place.IdFromModel,
//                         "view"
                        
//                    ));

                
//                await _interactionService.AddInteractionAsync(
//userId,
//place.IdFromModel,
//"view");
            }

            return await MapToDetailsAsync(place);
        }

        public async Task<PlaceDetailsDto> GetPlaceByIdAiPlan(int idFromModel)
        {
            if (idFromModel <= 0)
                throw new KeyNotFoundException("Invalid AI place identifier.");

            var placesQuery = await _unitOfWork.Places.FindAsyncInclude(
                p => p.IdFromModel == idFromModel,
                p => p.Include(x => x.Reviews)
                      .ThenInclude(r => r.Tourist)
                      .ThenInclude(t => t.User)
                      .Include(x => x.UserPhotos)
                      .ThenInclude(up => up.User)
            );

            var place = placesQuery.FirstOrDefault();
            if (place == null)
                throw new KeyNotFoundException("Place not found.");

            return await MapToDetailsAsync(place);
        }

        private async Task<PlaceDetailsDto> MapToDetailsAsync(Place place)
        {
            var details = new PlaceDetailsDto
            {
                Id = place.Id,
                Name = place.Name,
                Type = place.Type,
                Lat = place.Lat,
                Lng = place.Lng,
                MainImageUrl = place.MainImageUrl,
                City = place.City,
                TicketPrice = place.TicketPrice,
                AffiliateLink = place.AffiliateLink,
                Description = place.Description,
                IdFromModel = place.IdFromModel,
                AverageRate = (place.Reviews != null && place.Reviews.Any())
                    ? Math.Round(place.Reviews.Average(r => r.Rate), 1)
                    : 0,

                UserPhotos = (place.UserPhotos ?? (ICollection<PlacePhoto>)new List<PlacePhoto>()).Select(up => new UserPhotoDto
                {
                    Id = up.Id,
                    UserName = up.User?.UserName ?? "Traveler",
                    PhotoUrl = up.PhotoUrl,
                    UploadedAt = up.UploadedAt
                }).ToList(),

                Reviews = (place.Reviews ?? (ICollection<Review>)new List<Review>()).Select(r => new PlaceReviewDto
                {
                    TouristName = r.Tourist?.User?.UserName ?? "Tourist",
                    Rate = r.Rate,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                }).ToList()
            };

            if (!place.IsCustom && !string.IsNullOrEmpty(place.ExternalApiId))
            {
                var extData = await _externalApi.GetPlaceDetailsFromExternalApiAsync(place.ExternalApiId);
                details.OpeningHours = extData?.OpeningHours ?? "Not specified";
            }
            else
            {
                details.OpeningHours = "Open daily";
            }

            return details;
        }

        public async Task<IEnumerable<PlaceDisplayDto>> GetPlacesByTypeAsync(string type)
        {
            var places = await _unitOfWork.Places.FindAsyncInclude(
                p => p.Type.ToLower() == type.ToLower(),
                p => p.Include(x => x.Reviews)
            );

            // ✅ التعديل هنا أيضاً للترتيب عند الفلترة
            return places.OrderBy(p => p.SortOrder).Select(p => new PlaceDisplayDto
            {
                Id = p.Id,
                Name = p.Name,
                Type = p.Type,
                Lat = p.Lat,
                Lng = p.Lng,
                MainImageUrl = p.MainImageUrl,
                City = p.City,
                TicketPrice = p.TicketPrice,
                IdFromModel = p.IdFromModel,
                AverageRate = (p.Reviews != null && p.Reviews.Any())
                    ? Math.Round(p.Reviews.Average(r => r.Rate), 1)
                    : 0
            }).ToList();
        }

        // ================== Admin management ==================

        public async Task<PlaceDisplayDto> AddPlaceAsync(CreatePlaceDto dto)
        {
            string? localImageUrl = await _fileService.UploadFileAsync(dto.MainImageUrl, "places");
            string imageUrl = localImageUrl;
            string city = dto.City;
            string desc = dto.Description;
            decimal price = dto.TicketPrice;

            if (!dto.IsCustom && !string.IsNullOrEmpty(dto.ExternalApiId))
            {
                var extData = await _externalApi.GetPlaceDetailsFromExternalApiAsync(dto.ExternalApiId);
                if (extData != null)
                {
                    imageUrl = extData.MainImageUrl;
                    city = extData.City;
                    desc = extData.Description;
                    price = extData.TicketPrice;
                }
            }

            var place = new Place(dto.IsCustom, dto.ExternalApiId, dto.Name, dto.Type, dto.Lat, dto.Lng, imageUrl, city, desc, price, dto.AffiliateLink, dto.IdFromModel);

            await _unitOfWork.Places.AddAsync(place);
            await _unitOfWork.CompleteAsync();

            return new PlaceDisplayDto
            {
                Id = place.Id,
                Name = place.Name,
                Type = place.Type,
                Lat = place.Lat,
                Lng = place.Lng,
                MainImageUrl = place.MainImageUrl,
                City = place.City,
                TicketPrice = place.TicketPrice,
                IdFromModel = place.IdFromModel
            };
        }

        public async Task<PlaceDisplayDto> UpdatePlaceAsync(Guid id, UpdatePlaceDto dto)
        {
            var place = await _unitOfWork.Places.GetByIdAsync(id);
            if (place == null) throw new KeyNotFoundException("Place not found.");

            string? localImageUrl = await _fileService.UploadFileAsync(dto.MainImageUrl, "places");
            place.UpdateDetails(dto.Name, dto.Type, dto.Lat, dto.Lng, localImageUrl, dto.City, dto.Description, dto.TicketPrice, dto.AffiliateLink, dto.IdFromModel);
            _unitOfWork.Places.Update(place);
            await _unitOfWork.CompleteAsync();

            return new PlaceDisplayDto
            {
                Id = place.Id,
                Name = place.Name,
                Type = place.Type,
                Lat = place.Lat,
                Lng = place.Lng,
                MainImageUrl = place.MainImageUrl,
                City = place.City,
                TicketPrice = place.TicketPrice,
                IdFromModel = place.IdFromModel
            };
        }

        public async Task<bool> DeletePlaceAsync(Guid id)
        {
            var place = await _unitOfWork.Places.GetByIdAsync(id);
            if (place == null) throw new KeyNotFoundException("Place not found.");
            _unitOfWork.Places.Delete(place);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        // ================== User interactions ==================

        public async Task<bool> AddUserPhotoToPlaceAsync(Guid placeId, string userId, IFormFile photoUrl)
        {
            string? localImageUrl = await _fileService.UploadFileAsync(photoUrl, "placesTourist");
            var photo = new PlacePhoto(placeId, userId, localImageUrl);
            var place = await _unitOfWork.Places.GetByIdAsync(placeId);
            await _unitOfWork.PlacePhotos.AddAsync(photo);
            await _unitOfWork.CompleteAsync();
            //await _interactionService.AddInteractionAsync(
            //    userId,
            //    place.IdFromModel,
            //    "favorite");
            return true;
        }

        public async Task<bool> DeleteUserPhotoAsync(Guid photoId)
        {
            var photo = await _unitOfWork.PlacePhotos.GetByIdAsync(photoId);
            if (photo == null) throw new KeyNotFoundException("Photo not found.");
            _unitOfWork.PlacePhotos.Delete(photo);
            await _unitOfWork.CompleteAsync();
            return true;
        }
    }
}