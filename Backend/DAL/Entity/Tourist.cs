using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class Tourist
    {
        [Key, ForeignKey("User")]
        public string TouristId { get; private set; }
        public virtual AppUser User { get; private set; }

        [Required, StringLength(150)]
        public string Name { get; private set; }

        [Required, StringLength(50)]
        public string Language { get; private set; }
        // التقييم العام للسائح (بناءً على تقييمات المرشدين ليه)
        public float Rate { get; private set; } = 0;


        // العلاقات
        public virtual ICollection<Booking> Bookings { get; private set; } = new List<Booking>();
        public virtual ICollection<Story> Stories { get; private set; } = new List<Story>();
        public virtual ICollection<Review> Reviews { get; private set; } = new List<Review>();
        public virtual ICollection<AiPlan> AiPlans { get; private set; } = new List<AiPlan>();

        protected Tourist() { }

        public Tourist(string touristId, string name, string language)
        {
            TouristId = touristId;
            Name = name;
            Language = language;
        }

        // ميثود لتحديث التقييم
        public void UpdateAverageRate(float newAverage)
        {
            if (newAverage < 0 || newAverage > 5)
                throw new ArgumentException("Average rate must be between 0 and 5.");



            Rate = newAverage;
        }

        /// <summary>
        /// Update language CSV (e.g. "English,Arabic,French").
        /// </summary>
        public void UpdateLanguage(string languageCsv)
        {
            if (!string.IsNullOrWhiteSpace(languageCsv))
                Language = languageCsv.Trim();
        }

        public void UpdateName(string name)
        {
            if (!string.IsNullOrWhiteSpace(name))
                Name = name.Trim();
        }

       

    }
}
