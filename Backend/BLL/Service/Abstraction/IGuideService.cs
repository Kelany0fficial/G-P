
using Microsoft.AspNetCore.Http;

namespace BLL.Service.Abstraction
{
    public interface IGuideService
    {
        Task<GuideDetailsDto> GetMyProfileAsync(string guideId);
        Task<string> UpdateProfileImageAsync(string guideId, IFormFile profileImage);


        // هيجيب المرشدين المتأكتفين بس (State = true) ومش موقوفين
        Task<IEnumerable<GuideDisplayDto>> GetActiveGuidesAsync();

        Task<GuideDetailsDto> GetGuideByIdAsync(string guideId);
        Task<bool> UpdateGuideProfileAsync(string guideId, UpdateGuideProfileDto dto);
        Task<GuideWalletDto> GetGuideWalletAsync(string guideId);
        //Task<decimal> PayPlatformDuesAsync(string guideId, decimal amount);
    }
}
