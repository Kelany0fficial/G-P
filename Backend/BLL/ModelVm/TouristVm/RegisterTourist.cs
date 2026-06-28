using DAL.Enum;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace DAL.Entity
{
    public class RegisterTourist
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(150)]
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
        [Range(18, 100, ErrorMessage = "Age must be between 18 and 100")]
        public int Age { get; set; }

        [Required(ErrorMessage = "Country is required")]
        public string Country { get; set; } = string.Empty;

        /// <summary>Legacy single-value language field. Optional when <see cref="Languages"/> is supplied.</summary>
        public string? Language { get; set; }

        /// <summary>Multi-select list of spoken languages.</summary>
        public List<string>? Languages { get; set; }

        public IFormFile? UrlProfile { get; set; } = null;

        [Required(ErrorMessage = "Confirm Password is required")]
        [Compare("Password", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;

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
