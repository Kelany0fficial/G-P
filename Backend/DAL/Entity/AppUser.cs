using DAL.Enum;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class AppUser:IdentityUser
    {
        [Required]
        public int Age { get; private set; }

        [Required, StringLength(100)]
        public string Country { get; private set; }
        public string? UrlProfile { get; private set; }
        public EnumGender Gender { get;private set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        // العلاقات
        public virtual Tourist TouristProfile { get; private set; }
        public virtual TourGuide TourGuideProfile { get; private set; }

        protected AppUser() { }

        public AppUser(string userName, string email, int age, string country, EnumGender Gender, string urlProfile)
        {
            UserName = userName;
            Email = email;
            Age = age;
            Country = country;
            UrlProfile = urlProfile;
            this.Gender = Gender;

        }
        public void UpdateurlProfile(string urlProfile)
        {
            UrlProfile = urlProfile;

        }
    }
}
