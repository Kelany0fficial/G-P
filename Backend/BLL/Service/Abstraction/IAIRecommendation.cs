using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IAIRecommendation
    {
        Task<string> GetRecommendationsFromAiAsync(List<UserPlaceInteraction> interactions);

    }
}
