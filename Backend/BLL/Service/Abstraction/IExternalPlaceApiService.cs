using BLL.ModelVm.Places;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    // 2. ده العقد بتاعنا: أي حد عايز يشتغل مورد عندنا، لازم ينفذ الدالة دي!
    public interface IExternalPlaceApiService
    {
        // الدالة بتاخد الـ ID بتاع المكان في الـ API الخارجي، وترجع الداتا
        Task<ExternalPlaceData> GetPlaceDetailsFromExternalApiAsync(string externalApiId);
    }
}
