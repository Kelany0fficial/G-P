using BLL.ModelVm.Manual;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.TouristVm
{
    // لعرض الخطط اليدوية
    public class ManualPlanDisplayDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ManualPlanItemDto> Places { get; set; } = new List<ManualPlanItemDto>();
    }
}
