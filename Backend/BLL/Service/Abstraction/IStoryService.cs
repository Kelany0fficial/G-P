using BLL.ModelVm.Story;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IStoryService
    {
        Task<StoryDisplayDto> CreateStoryAsync(string userId, CreateStoryDto dto);
        Task<IEnumerable<StoryDisplayDto>> GetActiveStoriesAsync(string currentUserId);
        Task<IEnumerable<StoryDisplayDto>> GetUserStoriesAsync(string targetUserId, string currentUserId);
        Task<bool> ViewStoryAsync(Guid storyId, string userId);
        Task<bool> ToggleLoveStoryAsync(Guid storyId, string userId);
        Task DeleteStoryAsync(Guid storyId, string userId);
    }
}
