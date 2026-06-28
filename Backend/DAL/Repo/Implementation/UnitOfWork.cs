using DAL.DataApp;
using DAL.Entity;
using DAL.Repo.Abstraction;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Repo.Implementation
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;




        // جوه الكلاس
        public IGenericRepository<ManualPlan> ManualPlans { get; private set; }
        public IGenericRepository<UserPlaceInteraction> UserPlaceInteractions { get; private set; }
        public IGenericRepository<ManualPlanItem> ManualPlanItems { get; private set; }
        public IGenericRepository<Review> Reviews { get; private set; }

        public IGenericRepository<ChatMessage> ChatMessages { get; private set; }
        public IGenericRepository<AppUser> Users { get; private set; }

        public IGenericRepository<Tourist> Tourists { get; private set; }
        public IGenericRepository<TourGuide> TourGuides { get; private set; }
        public IGenericRepository<Place> Places { get; private set; }
        public IGenericRepository<Booking> Bookings { get; private set; }
        public IGenericRepository<AiPlan> AiPlans { get; private set; }
        public IGenericRepository<ManualPlan> ManualPlan { get; private set; }
        public IGenericRepository<Payment> Payments { get; private set; }
        public IGenericRepository<Story> Stories { get; private set; }
        public IGenericRepository<StoryInteraction> StoryInteractions { get; private set; }
        public IGenericRepository<PlacePhoto> PlacePhotos { get; private set; }
        public IGenericRepository<AppNotification> AppNotifications { get; private set; }



        public UnitOfWork(AppDbContext context)
        {
            _context = context;

            // تهيئة كل المستودعات
            Tourists = new GenericRepository<Tourist>(_context);
            TourGuides = new GenericRepository<TourGuide>(_context);
            Places = new GenericRepository<Place>(_context);
            Bookings = new GenericRepository<Booking>(_context);
            AiPlans = new GenericRepository<AiPlan>(_context);
            // جوه الكونستركتور
            ManualPlans = new GenericRepository<ManualPlan>(_context);
            ManualPlanItems = new GenericRepository<ManualPlanItem>(_context);
            Reviews= new GenericRepository<Review>(_context);
            Users=new GenericRepository<AppUser>(_context);
            Payments = new GenericRepository<Payment>(_context);
            ChatMessages = new GenericRepository<ChatMessage>(_context);
            Stories = new GenericRepository<Story>(_context);
            StoryInteractions = new GenericRepository<StoryInteraction>(_context);
            PlacePhotos = new GenericRepository<PlacePhoto>(_context);
            ManualPlan = new GenericRepository<ManualPlan>(_context);
            AppNotifications = new GenericRepository<AppNotification>(_context);
            UserPlaceInteractions = new GenericRepository<UserPlaceInteraction>(_context);
        }



        public async Task<int> CompleteAsync()
        {
            // هنا الداتا بيز بتتحفظ كلها مرة واحدة
            return await _context.SaveChangesAsync();
        }



        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
