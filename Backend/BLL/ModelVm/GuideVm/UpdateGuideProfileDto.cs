using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace BLL.ModelVm.GuideVm
{
    public class UpdateGuideProfileDto
    {
        [Required]
        [MaxLength(500)]
        public string Bio { get; set; } = string.Empty;

        /// <summary>Legacy single-value language column. Optional when <see cref="Languages"/> is supplied.</summary>
        public string? Language { get; set; }

        /// <summary>Multi-select list of spoken languages.</summary>
        public List<string>? Languages { get; set; }

        [Required]
        [Range(1, 10000, ErrorMessage = "Price per day must be a positive number.")]
        public decimal PriceOfDay { get; set; }

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

    public class GuideWalletDto
    {
        public decimal OutstandingBalance { get; set; }
        public decimal WalletBalance { get; set; }
        public int CompletedTours { get; set; }
        public int CancellationStrikes { get; set; }
        public bool IsSuspended { get; set; }
    }
}
