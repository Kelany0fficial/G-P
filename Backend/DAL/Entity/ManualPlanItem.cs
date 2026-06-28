using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class ManualPlanItem
    {
        public Guid Id { get; private set; }



        [Required]
        public int DayNumber { get; private set; } // اليوم الكام في الرحلة



        [Required]
        [ForeignKey("ManualPlan")]
        public Guid ManualPlanId { get; private set; }
        public virtual ManualPlan ManualPlan { get; private set; }



        [Required]
        [ForeignKey("Place")]
        public Guid PlaceId { get; private set; } // المكان اللي هيزوره
        public virtual Place Place { get; private set; }



        protected ManualPlanItem() { }



        public ManualPlanItem(Guid manualPlanId, Guid placeId, int dayNumber)
        {
            Id = Guid.NewGuid();
            ManualPlanId = manualPlanId;
            PlaceId = placeId;
            DayNumber = dayNumber;
        }
    }
}
