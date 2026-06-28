using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Admin
{
    public class PendingGuideDto
    {
        public string GuideId { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string NationalIdImage { get; set; } // أهم حقل للأدمن عشان يراجع الهوية
        public string Language { get; set; }
        public string Bio { get; set; }
        public decimal PriceOfDay { get; set; }
    }
}
