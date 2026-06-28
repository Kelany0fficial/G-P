
    using BLL.Service.Abstraction;
    
    using DAL.Entity;
     
    using global::BLL.ModelVm.Story;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    namespace BLL.Service.Implementation
    {
        public class StoryService : IStoryService
        {
            private readonly IUnitOfWork _unitOfWork;
            private readonly IFileService _fileService;



            public StoryService(IUnitOfWork unitOfWork, IFileService fileService)
            {
                _unitOfWork = unitOfWork;
                _fileService = fileService;
            }



        public async Task<StoryDisplayDto> CreateStoryAsync(string userId, CreateStoryDto dto)
        {
            if (dto.MediaFile == null || dto.MediaFile.Length == 0)
                throw new Exception("ملف غير صالح.");

            var extension = Path.GetExtension(dto.MediaFile.FileName).ToLower();

            var allowedVideoExtensions = new[] { ".mp4", ".mov", ".mkv" };
            var allowedImageExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };

            bool isVideo = allowedVideoExtensions.Contains(extension);
            bool isImage = allowedImageExtensions.Contains(extension);

            if (!isVideo && !isImage)
                throw new Exception("نوع الملف غير مدعوم.");

            if (dto.MediaFile.Length > 50 * 1024 * 1024)
                throw new Exception("حجم الملف كبير.");

            string folderName = isVideo ? "videos/stories" : "images/stories";

            string mediaUrl = await _fileService.UploadFileAsync(dto.MediaFile, folderName);

            var story = new Story(userId, dto.City, dto.Description, mediaUrl, isVideo ? "Video" : "Image");

            await _unitOfWork.Stories.AddAsync(story);
            await _unitOfWork.CompleteAsync();

            return await MapToDto(story, userId);
        }



        public async Task<IEnumerable<StoryDisplayDto>> GetActiveStoriesAsync(string currentUserId)
            {
                // جلب القصص اللي لسه شغالة (لم تتجاوز 24 ساعة)
                var activeStories = await _unitOfWork.Stories.FindAsyncInclude(
     s => s.ExpiresAt > DateTime.UtcNow,
     s => s.User,
     s => s.Interactions
     );



                return activeStories.OrderByDescending(s => s.CreatedAt)
                .Select(s => MapToDtoSync(s, currentUserId)).ToList();
            }



            public async Task<IEnumerable<StoryDisplayDto>> GetUserStoriesAsync(string targetUserId, string currentUserId)
            {
                // جلب القصص الخاصة بيوزر معين (للعرض داخل البروفايل الخاص به)
                var userStories = await _unitOfWork.Stories.FindAsyncInclude(
     s => s.UserId == targetUserId && s.ExpiresAt > DateTime.UtcNow,
     s => s.User,
     s => s.Interactions
     );



                return userStories.OrderByDescending(s => s.CreatedAt)
                .Select(s => MapToDtoSync(s, currentUserId)).ToList();
            }



            public async Task<bool> ViewStoryAsync(Guid storyId, string userId)
            {
                var interaction = await GetOrCreateInteraction(storyId, userId);

                if (!interaction.IsViewed)
                {
                    interaction.MarkAsViewed();
                    await _unitOfWork.CompleteAsync();
                }

                return true;
            }



            public async Task<bool> ToggleLoveStoryAsync(Guid storyId, string userId)
            {
                var interaction = await GetOrCreateInteraction(storyId, userId);

                interaction.ToggleLove();
                await _unitOfWork.CompleteAsync();

                return interaction.IsLoved; // returns true on love, false on un-love
            }



            public async Task DeleteStoryAsync(Guid storyId, string userId)
            {
                var story = await _unitOfWork.Stories.GetByIdAsync(storyId);
                if (story == null)
                    throw new KeyNotFoundException("Story not found.");

                if (!string.Equals(story.UserId, userId, StringComparison.Ordinal))
                    throw new UnauthorizedAccessException("You can only delete your own stories.");

                // Remove related interactions first (no cascade configured)
                var interactions = await _unitOfWork.StoryInteractions.FindAsync(i => i.StoryId == storyId);
                foreach (var interaction in interactions)
                {
                    _unitOfWork.StoryInteractions.Delete(interaction);
                }

                // Best-effort delete the media file from disk
                if (!string.IsNullOrWhiteSpace(story.MediaUrl))
                {
                    try { _fileService.DeleteFile(story.MediaUrl); } catch { /* non-fatal */ }
                }

                _unitOfWork.Stories.Delete(story);
                await _unitOfWork.CompleteAsync();
            }



            // ==========================================
            // Helper Methods (دوال مساعدة للـ Mapping والتفاعلات)
            // ==========================================



            private async Task<StoryInteraction> GetOrCreateInteraction(Guid storyId, string userId)
            {
                var interactionList = await _unitOfWork.StoryInteractions.FindAsync(i => i.StoryId == storyId && i.UserId == userId);
                var interaction = interactionList.FirstOrDefault();



                if (interaction == null)
                {
                    interaction = new StoryInteraction(storyId, userId);
                    await _unitOfWork.StoryInteractions.AddAsync(interaction);
                }

                return interaction;
            }



            private StoryDisplayDto MapToDtoSync(Story s, string currentUserId)
            {
                return new StoryDisplayDto
                {
                    StoryId = s.Id,
                    UserId = s.UserId,
                    UserName = s.User?.UserName ?? "مستخدم غير معروف",
                    UserProfileImage = s.User?.UrlProfile,
                    City = s.City,
                    Description = s.Description,
                    MediaUrl = s.MediaUrl,
                    MediaType = s.MediaType,
                    CreatedAt = s.CreatedAt,
                    // حساب التفاعلات
                    ViewsCount = s.Interactions.Count(i => i.IsViewed),
                    LovesCount = s.Interactions.Count(i => i.IsLoved),
                    // هل اليوزر اللي فاتح دلوقتي عمل لف للاستوري دي؟
                    IsLovedByMe = s.Interactions.Any(i => i.UserId == currentUserId && i.IsLoved)
                };
            }



            private async Task<StoryDisplayDto> MapToDto(Story s, string currentUserId)
            {
                // بنستخدم دي في الـ Create عشان الـ User مش بيكون معملوله Include لسه
                var user = await _unitOfWork.Users.GetByIdAsStringAsync(s.UserId);

                return new StoryDisplayDto
                {
                    StoryId = s.Id,
                    UserId = s.UserId,
                    UserName = user?.UserName ?? "مستخدم غير معروف",
                    UserProfileImage = user?.UrlProfile,
                    City = s.City,
                    Description = s.Description,
                    MediaUrl = s.MediaUrl,
                    MediaType = s.MediaType,
                    CreatedAt = s.CreatedAt,
                    ViewsCount = 0,
                    LovesCount = 0,
                    IsLovedByMe = false
                };
            }
        }
    }
