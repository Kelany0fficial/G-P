using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.AiPlane
{
    public class CreatePlanDto
    {
        [Required]
        public string Name { get; set; }

        public string Description { get; set; }

        [Required]
        [Range(1, 30, ErrorMessage = "Days must be between 1 and 30")]
        public int CountDay { get; set; }

        [Required]
        public int Budget { get; set; }

        [Required]
        public string Type { get; set; } // تاريخي، ترفيهي، إلخ
        public string Governorate { get; set; } // المحافظة
    }
}

