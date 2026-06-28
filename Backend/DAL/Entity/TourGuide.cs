
using Microsoft.AspNetCore.Http;

namespace DAL.Entity
{

    public class TourGuide
    {
        [Key, ForeignKey("User")]
        public string GuideId { get; private set; }
        public virtual AppUser User { get; private set; }

        [Required]
        public string NationalIdImage { get; private set; }
       

        [MaxLength(500)]
        public string Bio { get; private set; }

        [Required, StringLength(100)]
        public string Language { get; private set; }

        [Required]
        public decimal PriceOfDay { get; private set; }
        // المحفظة (الفلوس الزيادة اللي ليه عند الموقع)
        public decimal WalletBalance { get; private set; } = 0;
        public decimal OutstandingBalance { get; private set; } = 0;
        public bool State { get; private set; } = false;
        public float Rate { get; private set; } = 0;
        // حقل يسجل تاريخ أول مديونية نزلت عليه
        public DateTime? DebtStartDate { get; private set; }



        // العلاقات
        public virtual ICollection<Booking> Bookings { get; private set; } = new List<Booking>();
        public virtual ICollection<Review> Reviews { get; private set; } = new List<Review>();
        public virtual ICollection<Payment> Payments { get; private set; } = new List<Payment>();
        public int CancellationStrikes { get; private set; } = 0; // عدد مرات الإلغاء بعد الموافقة
        public bool IsSuspended { get; private set; } = false;  // هل الحساب موقوف؟


        public void UpdateInfo(string bio, string language, decimal priceOfDay)
        {
            Bio = bio;
            Language = language;
            PriceOfDay = priceOfDay;
        }
        public void AddStrike()
        {
            CancellationStrikes++;
            if (CancellationStrikes >= 3) IsSuspended = true; // إيقاف تلقائي بعد 3 مشاكل
        }
        protected TourGuide() { }

        public TourGuide(string guideId, string nationalIdImage, string language, decimal priceOfDay, string bio)
        {
            GuideId = guideId;
            NationalIdImage = nationalIdImage;
            Language = language;
            PriceOfDay = priceOfDay;
            Bio = bio;
            
        }

        // بيزنس لوجيك: إضافة عمولة (خصم من المحفظة التلقائي)
        public void AddDebt(decimal amount)
        {
            if (amount <= 0) throw new ArgumentException("Debt amount must be positive.");



            // 1. لو ليه رصيد في المحفظة، نخصم منه الأول
            if (WalletBalance > 0)
            {
                if (WalletBalance >= amount)
                {
                    WalletBalance -= amount;
                    return; // الفلوس اتخصمت بالكامل ومش هنزود مديونية
                }
                else
                {
                    amount -= WalletBalance; // نطرح اللي في المحفظة من العمولة المطلوبة
                    WalletBalance = 0; // نصفر المحفظة
                }
            }



            // 2. لو مفيش رصيد يكفي، نزود الباقي كمديونية
            if (OutstandingBalance == 0)
            {
                // دي أول مرة ينزل عليه مديونية، نسجل التاريخ عشان الـ Worker يبدأ يعد 30 يوم
                DebtStartDate = DateTime.UtcNow;
            }

            OutstandingBalance += amount;
        }

        // بيزنس لوجيك: سداد المديونية (وشحن المحفظة بالزيادة)
        public decimal PayDues(decimal amountPaid)
        {
            if (amountPaid <= 0) throw new ArgumentException("Payment amount must be greater than zero.");



            if (amountPaid > OutstandingBalance)
            {
                // لو دفع بزيادة: نصفر المديونية ونحط الباقي في المحفظة
                decimal extraMoney = amountPaid - OutstandingBalance;
                OutstandingBalance = 0;
                WalletBalance += extraMoney;
                DebtStartDate = null; // 🚨 تصفير التاريخ عشان المديونية خلصت
            }
            else
            {
                // لو دفع على القد أو أقل
                OutstandingBalance -= amountPaid;
                if (OutstandingBalance == 0)
                {
                    DebtStartDate = null; // 🚨 تصفير التاريخ لو المديونية بقت صفر
                }
            }



            return OutstandingBalance;
        }

        // بيزنس لوجيك: تفعيل حساب المرشد
        public void ActivateGuide()
        {
            State = true;
            IsSuspended = false;
        }

        // دالة جديدة بنناديها لما الـ 30 يوم يخلصوا
        public void SuspendForDebt() { State = false; IsSuspended = true; }

        // بيزنس لوجيك: تحديث التقييم
        public void UpdateAverageRate(float newAverage)
        {
            if (newAverage < 0 || newAverage > 5)
                throw new ArgumentException("Average rate must be between 0 and 5.");
            Rate = newAverage;
        }
    }
}
