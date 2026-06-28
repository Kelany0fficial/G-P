using DAL.Entity;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
namespace DAL.Entity
{
    
    public class Place
    {
        public Guid Id { get; private set; }
        
        public int IdFromModel { get; private set; } 
        public bool IsCustom { get; private set; } // يدوي ولا API؟
        public string? ExternalApiId { get; private set; }

        public int? SortOrder { get; private set; }

        [Required, StringLength(200)]
        public string Name { get; private set; }



        [Required, StringLength(50)]
        public string Type { get; private set; }



        public float Lat { get; private set; }
        public float Lng { get; private set; }
        public string? AffiliateLink { get; private set; }



        // بيانات الكاشينج (عشان نعرضها في اللستة من غير مانكلم جوجل)
        public string? MainImageUrl { get; private set; }
        public string? City { get; private set; }
        public string? Description { get; private set; }
        public decimal TicketPrice { get; private set; } = 0;



        // العلاقات
        public virtual ICollection<ManualPlanItem> ManualPlan { get; private set; } = new List<ManualPlanItem>();
        public virtual ICollection<Review> Reviews { get; private set; } = new List<Review>();
        public virtual ICollection<PlacePhoto> UserPhotos { get; private set; } = new List<PlacePhoto>();



        protected Place() { }



        public Place(bool isCustom, string? externalApiId, string name, string type, float lat, float lng, string? mainImageUrl, string? city, string? description, decimal ticketPrice, string? affiliateLink = null, int idFromModel = 0)
        {
            Id = Guid.NewGuid();
            IsCustom = isCustom;
            ExternalApiId = externalApiId;
            Name = name;
            Type = type;
            Lat = lat;
            Lng = lng;
            MainImageUrl = mainImageUrl;
            City = city;
            Description = description;
            TicketPrice = ticketPrice;
            AffiliateLink = affiliateLink;
            IdFromModel = idFromModel;
        }



        // دالة تحديث بيانات المكان (للأدمن)
        public void UpdateDetails(string name, string type, float lat, float lng, string? mainImageUrl,
            string? city, string? description, decimal ticketPrice, string? affiliateLink,
            int? idFromModel = null)
        {
            Name = name;
            Type = type;
            Lat = lat;
            Lng = lng;
            MainImageUrl = mainImageUrl;
            City = city;
            Description = description;
            TicketPrice = ticketPrice;
            AffiliateLink = affiliateLink;
            // Only overwrite when admin explicitly provides a positive value —
            // prevents accidentally zeroing out an ID the AI depends on.
            if (idFromModel.HasValue && idFromModel.Value > 0)
                IdFromModel = idFromModel.Value;
        }
    }
}