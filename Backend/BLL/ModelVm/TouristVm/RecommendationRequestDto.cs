using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.TouristVm
{
    public class RecommendationRequestDto
    {
        public List<ActionDto> Actions { get; set; }
    }

    public class ActionDto
    {
        public int PlaceId { get; set; }

        public string Action { get; set; }
    }
}
