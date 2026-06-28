using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Payment
{
    public class ProcessPaymentDto
    {
        [Required(ErrorMessage = "المبلغ مطلوب")]
        [Range(1, 100000, ErrorMessage = "المبلغ يجب أن يكون أكبر من صفر")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "طريقة الدفع مطلوبة")]
        public string PayMethod { get; set; } // مثال: "Visa", "MasterCard", "InstaPay"
    }
}
