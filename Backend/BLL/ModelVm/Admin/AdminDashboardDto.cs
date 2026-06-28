using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Admin
{
    public class AdminDashboardDto
    {
        // 1. الكروت (أرقام سريعة)
        public int TotalTourists { get; set; }
        public int TotalGuides { get; set; }
        public int PendingGuides { get; set; } // مرشدين مستنيين التفعيل
        public decimal TotalSystemRevenue { get; set; } // إجمالي العمولات اللي دخلت الموقع
        public decimal TotalOutstandingDebts { get; set; } // إجمالي المديونيات اللي بره عند المرشدين
        public int TotalCompletedBookings { get; set; }

        // --- الإضافات الديموغرافية ---
        public List<CountryStatDto> TopTouristCountries { get; set; } // أكثر 5 دول بتزور مصر
        public AgeDistributionDto TouristAgeDistribution { get; set; } // توزيع الأعمار
        public List<GenderStatDto> GenderDistribution { get; set; } // نسبة الذكور للإناث
        public List<LanguageStatDto> TopRequestedLanguages { get; set; } // أكثر اللغات طلباً

        // --- الإضافات الديموغرافية --- public L... by Ahmed Abdelkader Ahmed Kilany
 






        // 2. الرسم البياني للحجوزات والعمولات (Line Chart - آخر 12 شهر)
        public List<MonthlyStatsDto> MonthlyPerformance { get; set; }



        // 3. توزيع حالات الحجوزات (Pie Chart)
        public List<StatusDistributionDto> BookingStatusDistribution { get; set; }



        // 4. أفضل 5 مرشدين (Top Rated)
        public List<TopGuideDto> TopRatedGuides { get; set; }
    }



    public class MonthlyStatsDto
    {
        public string MonthName { get; set; } // مثلاً "Jan 2024"
        public int BookingsCount { get; set; }
        public decimal Commission { get; set; }
    }



    public class StatusDistributionDto
    {
        public string StatusName { get; set; } // Pending, Accepted, etc.
        public int Count { get; set; }
    }



    public class TopGuideDto
    {
        public string Name { get; set; }
        public float Rate { get; set; }
        public decimal Earnings { get; set; } // قد إيه دخل للموقع من وراه
    }

    public class CountryStatDto
    {
        public string CountryName { get; set; }
        public int Count { get; set; }
    }



    public class AgeDistributionDto
    {
        public int Youth { get; set; } // 18 - 25
        public int Adults { get; set; } // 26 - 40
        public int MiddleAged { get; set; } // 41 - 55
        public int Seniors { get; set; } // 55+
    }



    public class GenderStatDto
    {
        public string Gender { get; set; }
        public int Count { get; set; }
    }



    public class LanguageStatDto
    {
        public string Language { get; set; }
        public int Count { get; set; }
    }


}

