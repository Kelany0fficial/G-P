using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Places
{
    public class UserPhotoDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }
        public string PhotoUrl { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
