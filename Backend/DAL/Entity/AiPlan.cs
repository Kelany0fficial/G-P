using System;
using System.Collections.Generic;

using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class AiPlan
    {
        public Guid Id { get; private set; }

        [Required, StringLength(200)]
        public string Name { get; private set; }

        public string Description { get; private set; }

        [Required]
        public int CountDay { get; private set; }

        [Required]
        public decimal Budget { get; private set; }

        [Required, StringLength(50)]
        public string Type { get; private set; }

        [Required]
        [ForeignKey("Tourist")]
        public string TouristId { get; private set; }
        public virtual Tourist Tourist { get; private set; }

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        // جوه كلاس AiPlan
        public string? AiResponseJson { get; private set; }
        public virtual ICollection<Booking> Bookings { get; private set; }= new List<Booking>(); 



        public void SetAiResponse(string jsonResponse)
        {
            this.AiResponseJson = jsonResponse;
        }
       
        protected AiPlan() { }

        public AiPlan(string name, string description, int countDay, decimal budget, string type, string touristId)
        {
            if (countDay <= 0)
                throw new ArgumentException("Trip duration must be at least 1 day.");
            if (budget <= 0)
                throw new ArgumentException("Budget must be a positive amount.");

            Id = Guid.NewGuid();
            Name = name;
            Description = description;
            CountDay = countDay;
            Budget = budget;
            Type = type;
            TouristId = touristId;
        }

    }
}
