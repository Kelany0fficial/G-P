using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace BLL.ModelVm.TouristVm
{
    public class UpdateTouristProfileDto
    {
        [Required(ErrorMessage = "Username is required.")]
        public string UserName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Country is required.")]
        public string Country { get; set; } = string.Empty;

        /// <summary>
        /// Single language (legacy). Prefer <see cref="Languages"/>.
        /// When both are present, Languages wins.
        /// </summary>
        public string? Language { get; set; }

        /// <summary>
        /// Multi-select list of languages. Stored CSV in the database column.
        /// </summary>
        public List<string>? Languages { get; set; }

        [Range(12, 120, ErrorMessage = "Invalid age.")]
        public int Age { get; set; }

        /// <summary>
        /// Resolves the canonical CSV value for persistence.
        /// </summary>
        public string ResolveLanguageCsv()
        {
            if (Languages != null && Languages.Count > 0)
            {
                return string.Join(",", Languages
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .Distinct(System.StringComparer.OrdinalIgnoreCase));
            }
            return Language?.Trim() ?? string.Empty;
        }
    }
}
