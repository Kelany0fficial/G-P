using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.GuideVm
{

    // 1. DTO المحفظة
    public class GuideWalletDTO
    {
        public decimal OutstandingBalance { get; set; } // المديونية
        public decimal WalletBalance { get; set; } // رصيد المحفظة (الفلوس الزيادة)
        public int CompletedTours { get; set; }
        public int CancellationStrikes { get; set; }
        public bool IsSuspended { get; set; }
    }



    // 2. DTO تفاصيل المرشد (عشان تظهرله في البروفايل)
    public class GuideDetailsWallet : GuideDisplayDto
    {
        public string Bio { get; set; }
        public int CompletedToursCount { get; set; }
        public decimal OutstandingBalance { get; set; } // ضفنا دي هنا
        public decimal WalletBalance { get; set; } // وضفنا دي هنا
        public List<GuideReviewDto> Reviews { get; set; } = new List<GuideReviewDto>();
    }


}
