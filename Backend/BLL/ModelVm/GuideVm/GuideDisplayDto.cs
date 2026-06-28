using BLL.ModelVm.Story;
using System.Collections.Generic;

namespace BLL.ModelVm.GuideVm
{
    public class GuideDisplayDto
    {
        public string GuideId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public decimal PriceOfDay { get; set; }
        /// <summary>CSV of languages (backwards-compat field).</summary>
        public string Language { get; set; } = string.Empty;
        /// <summary>Multi-select list parsed from <see cref="Language"/>.</summary>
        public List<string> Languages { get; set; } = new List<string>();
        public float Rate { get; set; }
        public decimal WalletBalance { get; set; }
    }

    public class GuideDetailsDto : GuideDisplayDto
    {
        public string Bio { get; set; } = string.Empty;
        public List<StoryDisplayDto> ActiveStories { get; set; } = new List<StoryDisplayDto>();
        public int CompletedToursCount { get; set; }
        public List<GuideReviewDto> Reviews { get; set; } = new List<GuideReviewDto>();
    }

    public class GuideReviewDto
    {
        public string TouristName { get; set; } = string.Empty;
        public int Rate { get; set; }
        public string Comment { get; set; } = string.Empty;
    }
}
