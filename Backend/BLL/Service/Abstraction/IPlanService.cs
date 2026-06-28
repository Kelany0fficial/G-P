using BLL.ModelVm.AiPlane;
using BLL.ModelVm.Manual;
using BLL.ModelVm.TouristVm;
using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IPlanService
    {
        Task<IEnumerable<AiPlanDisplayDto>> GetMyAiPlansAsync(string touristId);
        Task<IEnumerable<ManualPlanDisplayDto>> GetMyManualPlansAsync(string touristId);
        Task<Guid> CreateAndSavePlanAsync(CreatePlanDto dto, string touristId);
        //Task<Guid> CreateAndSavePlanAsyncByMe(CreatePlanDto dto, string touristId);
        //Task<IEnumerable<AiPlanDTO>> GetPlansCreatedByAi();
        //Task<IEnumerable<AiPlanDTO>> GetPlansCreatedBy();
        Task<Guid> CreateManualPlanAsync(CreateManualPlanDto dto, string touristId);
        Task<AiPlanDetailedDisplayDto> GetAiPlanDetailsAsync(Guid planId, string touristId);



    }
}
