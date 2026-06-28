using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IAiIntegrationService
    {
        Task<string> GetPlanFromPythonApi(int days, decimal budget, string type,string Governorate);
    }
}
