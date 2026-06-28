using DAL.Entity;

namespace BLL.Service.Implementation
{
    public class BookingUpdateWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public BookingUpdateWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                    var expiredBookings = await unitOfWork.Bookings.FindAsync(
                        b => b.State == "Accepted" && b.CreatedAt.AddMinutes(60) < DateTime.UtcNow
                    );

                    if (expiredBookings.Any())
                    {
                        // Batch-load all needed guides in one query instead of N separate DB calls
                        var guideIds = expiredBookings.Select(b => b.GuideId).Distinct().ToHashSet();
                        var guides = (await unitOfWork.TourGuides.FindAsync(g => guideIds.Contains(g.GuideId)))
                            .ToDictionary(g => g.GuideId);

                        foreach (var booking in expiredBookings)
                        {
                            booking.CompleteBooking();

                            if (guides.TryGetValue(booking.GuideId, out var guide))
                            {
                                guide.AddDebt(booking.CommissionAmount);
                                unitOfWork.TourGuides.Update(guide);
                            }

                            unitOfWork.Bookings.Update(booking);
                        }

                        await unitOfWork.CompleteAsync();
                    }
                }

                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }
    }
}
