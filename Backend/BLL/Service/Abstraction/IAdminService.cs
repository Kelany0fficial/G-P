using BLL.ModelVm.Admin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IAdminService
    {
        Task<IEnumerable<UserManagementDto>> GetAllUsersAsync();
        Task<string> DeleteUserPermanentlyAsync(string userId);
        Task<string> ToggleUserBanStatusAsync(string userId);
        // جلب المرشدين اللي لسه متوافقش عليهم
        Task<IEnumerable<PendingGuideDto>> GetPendingGuidesAsync();
        Task<UserStatusDto> GetUserStatusAsync(string userId);
        // الموافقة على المرشد
        Task<bool> ApproveGuideAsync(string guideId);

        // رفض المرشد (مسح طلبه عشان يقدر يقدم تاني بصورة بطاقة أوضح مثلاً)
        Task<bool> RejectGuideAsync(string guideId);
        Task<IEnumerable<ReviewModerationDto>> GetAllReviewsForModerationAsync();
        Task<bool> DeleteReviewAsync(Guid reviewId);



        Task<IEnumerable<StoryModerationDto>> GetAllStoriesForModerationAsync();
        Task<bool> DeleteStoryAsync(Guid storyId);
        Task<AdminDashboardDto> GetDashboardStatsAsync();
    }
}
