using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Admin
{
    public class ReviewModerationDto
    {
        public Guid Id { get; set; }
        public string AuthorName { get; set; } // اسم اللي كتب التقييم
        public string TargetName { get; set; } // اسم المرشد أو المكان اللي اتقيم
        public int Rate { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }



    public class StoryModerationDto
    {
        public Guid Id { get; set; }
        public string GuideName { get; set; } // اسم المرشد صاحب الاستوري
        public string MediaUrl { get; set; }
        public string Caption { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
