using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class UserPlaceInteraction
    {
        public Guid Id { get; private set; }

        public string UserId { get; private set; }

        public int PlaceId { get; private set; }

        public string Action { get; private set; } // view, favorite, trip

        public DateTime CreatedAt { get; private set; }

        public virtual AppUser User { get; private set; }
        public virtual Place Place { get; private set; }

        public UserPlaceInteraction(
            string userId,
            int placeId,
            string action)
        {
            Id = Guid.NewGuid();
            UserId = userId;
            PlaceId = placeId;
            Action = action;
            CreatedAt = DateTime.UtcNow;
        }
    }
}
