using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.GuideVm
{
    public class UpdateProfileImageGuid
    {
        public IFormFile profileImage { get; set; }
    }
}
