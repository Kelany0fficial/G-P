using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.TouristVm
{
    public class AiPlanDisplayDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int CountDay { get; set; }
        public decimal Budget { get; set; }
        public string Type { get; set; }
        public DateTime CreatedAt { get; set; }
        // الرد اللي جاي من البايثون
        public string AiResponse { get; set; }
    }
}
