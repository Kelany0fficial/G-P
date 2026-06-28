using BLL.ModelVm.AiPlane;
using BLL.ModelVm.Places;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IPlaceService
    {
      
        Task<IEnumerable<PlaceDisplayDto>> GetAllPlacesAsync();
        Task<PlaceDetailsDto> GetPlaceByIdAsync(Guid id, int? externalId, string userId);
        Task<IEnumerable<PlaceDisplayDto>> GetPlacesByTypeAsync(string type);

        Task<PlaceDisplayDto> AddPlaceAsync(CreatePlaceDto dto);
        Task<PlaceDisplayDto> UpdatePlaceAsync(Guid id, UpdatePlaceDto dto);
        Task<bool> DeletePlaceAsync(Guid id);
        Task<PlaceDetailsDto> GetPlaceByIdAiPlan(int id);

        Task<bool> AddUserPhotoToPlaceAsync(Guid placeId, string userId, IFormFile photoUrl);
        Task<bool> DeleteUserPhotoAsync(Guid photoId);
    }
}
