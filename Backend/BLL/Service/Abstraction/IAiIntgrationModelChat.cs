using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IAiIntegrationModelChat
    {
        Task<string> GetPlanFromModelChat(IFormFile file, string lang = "ar");
    }
}
