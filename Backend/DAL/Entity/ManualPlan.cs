using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class ManualPlan
    {
        public Guid Id { get; private set; }

        [Required, StringLength(200)]
        public string Name { get; private set; }



        [Required]
        public DateTime StartDate { get; private set; } // تاريخ بداية الرحلة

        //[Required]
        //public DateTime EndDate { get; private set; } // تاريخ نهاية الرحلة (بيتحسب أوتوماتيك بناءً على عدد الأيام)
        //[Required]
        //public int NumberOfDays { get; private set; } // عدد أيام الرحلة

        [Required]
        [ForeignKey("Tourist")]
        public string TouristId { get; private set; }
        public virtual Tourist Tourist { get; private set; }



        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;



        public virtual ICollection<ManualPlanItem> Items { get; private set; } = new List<ManualPlanItem>();

        public virtual ICollection<Booking> Bookings { get; private set; } = new List<Booking>();

        protected ManualPlan() { }



        public ManualPlan(string name, DateTime startDate, string touristId)
        {
            Id = Guid.NewGuid();
            Name = name;
            StartDate = startDate; // تعيين التاريخ
          
            TouristId = touristId;
        }
    }
}
