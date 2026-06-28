using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.TouristVm
{
    public class UpdateProfileImageTourist
    {
        public IFormFile profileImage { get; set; }
    }
}
