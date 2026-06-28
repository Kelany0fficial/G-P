using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.TouristVm
{
    public class ManualPlanItemDto
    {
        public Guid PlaceId { get; set; }
        public string PlaceName { get; set; } // هنجيبها من جدول الأماكن
        public int DayNumber { get; set; }
        public string ? ImageUrl { get; set; } 
    }

}
