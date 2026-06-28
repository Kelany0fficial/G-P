using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace BLL.ModelVm.AiPlane
{
    public class AiPlacePlanDto
    {
        public int Day { get; set; }

        [JsonPropertyName("place_id")]
        public int PlaceId { get; set; }
    }
}
