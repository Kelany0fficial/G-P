using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Places
{
    public class AddPhotoToPlace
    {
        public IFormFile photoUrl { get; set; }
    }
}
