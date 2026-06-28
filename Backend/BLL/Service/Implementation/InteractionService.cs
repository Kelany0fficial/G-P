using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class InteractionService: BLL.Service.Abstraction.IInteractionService
    {
        private readonly IUnitOfWork _unitOfWork;
        public InteractionService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }
        public async Task AddInteractionAsync(
 string userId,
 int placeId,
 string action)
        {
            var interaction = new UserPlaceInteraction(
                userId,
                placeId,
                action);

            await _unitOfWork.UserPlaceInteractions
                .AddAsync(interaction);

            await _unitOfWork.CompleteAsync();
        }
        public async Task<List<UserPlaceInteraction>> GetUserInteractions(string userId)
        {
            return await _unitOfWork.UserPlaceInteractions
                .GetAllAsync(x => x.UserId == userId);
        }
    }
}
