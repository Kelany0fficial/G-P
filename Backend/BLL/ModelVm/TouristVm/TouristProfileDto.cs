using BLL.ModelVm.Story;
using System.Collections.Generic;

namespace BLL.ModelVm.TouristVm
{
    public class TouristProfileDto
    {
        public string TouristId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        /// <summary>CSV value for backwards compatibility.</summary>
        public string Language { get; set; } = string.Empty;
        /// <summary>Multi-select list parsed from <see cref="Language"/>.</summary>
        public List<string> Languages { get; set; } = new List<string>();
        public float RateT { get; set; }
        public string? ProfileImageUrl { get; set; }
        public List<StoryDisplayDto> ActiveStories { get; set; } = new List<StoryDisplayDto>();
    }
}
