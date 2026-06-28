using DAL.Entity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.DataApp
{
    public class AppDbContext : IdentityDbContext<AppUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }

        public DbSet<ManualPlan> ManualPlans { get; set; }
        public DbSet<ManualPlanItem> ManualPlanItems { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<StoryInteraction> StoryInteractions { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Tourist> Tourists { get; set; }
        public DbSet<TourGuide> TourGuides { get; set; }
        public DbSet<Story> Stories { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<AiPlan> AiPlans { get; set; }
        public DbSet<UserPlaceInteraction> UserPlaceInteractions { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Place> Places { get; set; }
        public DbSet<PlacePhoto> PlacePhotos { get; set; }
        public DbSet<AppNotification> AppNotifications { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // 1. منع الـ Cascade Delete للحجوزات عشان ميحصلش Multiple Cascade Paths
            builder.Entity<Booking>()
                .HasOne(b => b.Tourist)
                .WithMany(t => t.Bookings)
                .HasForeignKey(b => b.TouristId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Booking>()
                .HasOne(b => b.Guide)
                .WithMany(g => g.Bookings)
                .HasForeignKey(b => b.GuideId)
                .OnDelete(DeleteBehavior.Restrict);

            // 2. منع الـ Cascade Delete للتقييمات
            builder.Entity<Review>()
                .HasOne(r => r.Tourist)
                .WithMany(t => t.Reviews)
                .HasForeignKey(r => r.TouristId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Review>()
                .HasOne(r => r.Guide)
                .WithMany(g => g.Reviews)
                .HasForeignKey(r => r.GuideId)
                .OnDelete(DeleteBehavior.Restrict);

            // 3. تأكيد علاقات الـ One-to-One
            builder.Entity<Tourist>()
                .HasOne(t => t.User)
                .WithOne(u => u.TouristProfile)
                .HasForeignKey<Tourist>(t => t.TouristId);

            builder.Entity<TourGuide>()
                .HasOne(g => g.User)
                .WithOne(u => u.TourGuideProfile)
                .HasForeignKey<TourGuide>(g => g.GuideId);
        }
    } 

}

