using DAL.Enum;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace BLL.ModelVm.GuideVm
{
    public class RegisterGuideDto
    {
        [Required(ErrorMessage = "Full Name is required")]
        [StringLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "User Name is required")]
        public string UserName { get; set; } = string.Empty;

        [Required]
        public EnumGender Gender { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; set; } = string.Empty;

        [Required]
        public int Age { get; set; }

        [Required]
        public string Country { get; set; } = string.Empty;

        // Professional fields
        [Required(ErrorMessage = "National ID image is required")]
        public IFormFile NationalIdImage { get; set; } = null!;

        /// <summary>Legacy single language. Optional when <see cref="Languages"/> is supplied.</summary>
        public string? Language { get; set; }

        /// <summary>Multi-select list of spoken languages.</summary>
        public List<string>? Languages { get; set; }

        [Required]
        [Range(1, 10000, ErrorMessage = "Price of day must be greater than zero")]
        public decimal PriceOfDay { get; set; }

        [MaxLength(500)]
        public string Bio { get; set; } = string.Empty;

        public IFormFile? ProfileImageFile { get; set; }

        public class UpdateProfileImageDto
        {
            [Required(ErrorMessage = "Profile image is required.")]
            public IFormFile ProfileImage { get; set; } = null!;
        }

        public string ResolveLanguageCsv()
        {
            if (Languages != null && Languages.Count > 0)
            {
                return string.Join(",", Languages
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .Distinct(System.StringComparer.OrdinalIgnoreCase));
            }
            return string.IsNullOrWhiteSpace(Language) ? "English" : Language.Trim();
        }
    }
}
