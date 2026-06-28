using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Places
{
    public class ExternalPlaceData
    {
        public string MainImageUrl { get; set; }
        public string City { get; set; }
        public decimal TicketPrice { get; set; }
        public string Description { get; set; }
        public string OpeningHours { get; set; }
    }
}
