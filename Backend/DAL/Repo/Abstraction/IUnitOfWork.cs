using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Repo.Abstraction
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<UserPlaceInteraction> UserPlaceInteractions { get; }
        IGenericRepository<ManualPlan> ManualPlans { get; }
        IGenericRepository<ManualPlanItem> ManualPlanItems { get; }
        IGenericRepository<Tourist> Tourists { get; }
        IGenericRepository<TourGuide> TourGuides { get; }
        IGenericRepository<Place> Places { get; }
        IGenericRepository<Booking> Bookings { get; }
        IGenericRepository<AiPlan> AiPlans { get; }
        IGenericRepository<Review> Reviews { get; }
        IGenericRepository<AppUser> Users { get; }
        IGenericRepository<ChatMessage> ChatMessages { get; }
        IGenericRepository<Story> Stories { get; }
        IGenericRepository<StoryInteraction> StoryInteractions { get; }
        IGenericRepository<PlacePhoto> PlacePhotos { get; }
        IGenericRepository<ManualPlan> ManualPlan { get; }
        IGenericRepository<AppNotification> AppNotifications { get; }

        IGenericRepository<Payment> Payments { get; }
        // تقدر تضيف باقي الجداول هنا بنفس الطريقة

        Task<int> CompleteAsync(); // دي الميثود اللي بتنادي SaveChangesAsync
    }
}
