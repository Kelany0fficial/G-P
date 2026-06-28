using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Places
{
    public class UpdatePlaceDto
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public string Type { get; set; }
        public float Lat { get; set; }
        public float Lng { get; set; }
        public string? Description { get; set; }
        public IFormFile? MainImageUrl { get; set; }
        public string? City { get; set; }
        public decimal TicketPrice { get; set; }
        public string? AffiliateLink { get; set; }
        /// <summary>
        /// Integer ID the Python AI model uses to reference this place.
        /// Must match the place_id values your AI returns.  Leave null / 0 to keep existing value.
        /// </summary>
        public int? IdFromModel { get; set; }
    }
}
