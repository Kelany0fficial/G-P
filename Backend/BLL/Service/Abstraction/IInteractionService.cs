using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IInteractionService
    {
        Task AddInteractionAsync(
   string userId,
   int placeId,
   string action);

        Task<List<UserPlaceInteraction>> GetUserInteractions(string userId);
    }
}
