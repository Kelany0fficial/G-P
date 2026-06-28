using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Places
{
    public class PlaceDisplayDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public float Lat { get; set; }
        public float Lng { get; set; }
        public string? MainImageUrl { get; set; }
        public string? City { get; set; }
        public decimal TicketPrice { get; set; }
        public int IdFromModel { get; set; } = 0;
        public double AverageRate { get; set; }
    }



    // Tourist-facing place details
    public class PlaceDetailsDto : PlaceDisplayDto
    {
        public string? AffiliateLink { get; set; }
        public string? Description { get; set; }
        public string? OpeningHours { get; set; }
        public List<PlaceReviewDto> Reviews { get; set; } = new List<PlaceReviewDto>();
        public List<UserPhotoDto> UserPhotos { get; set; } = new List<UserPhotoDto>();
    }



    public class PlaceReviewDto
    {
        public string TouristName { get; set; }
        public int Rate { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
