using System.Text.Json;
using BLL.Hubs;
using BLL.ModelVm.AiPlane;
using BLL.ModelVm.Booking;
using BLL.ModelVm.GuideVm;
using BLL.Service.Abstraction;
using DAL.Entity;
using DAL.Repo.Abstraction;
using Microsoft.AspNetCore.SignalR;

namespace BLL.Service.Implementation
{
    public class BookingService : IBookingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHubContext<NotificationHub> _hub;

        public BookingService(IUnitOfWork unitOfWork, IHubContext<NotificationHub> hub)
        {
            _unitOfWork = unitOfWork;
            _hub = hub;
        }

        // ----- Real-time helpers -----

        private async Task PushBookingEventAsync(string toUserId, string eventName, object payload)
        {
            // Per-user group keeps the message off of other connections, regardless of role.
            await _hub.Clients
                .Group(NotificationHub.UserGroup(toUserId))
                .SendAsync(eventName, payload);
        }

        public async Task<Guid> CreateBookingRequestAsync(CreateBookingDto dto, string touristId)
        {
            if (dto.AiPlanId.HasValue && dto.ManualPlanId.HasValue)
                throw new ArgumentException("You cannot pick two plans at once.");

            var guide = await _unitOfWork.TourGuides.GetByIdAsStringAsync(dto.GuideId);
            if (guide == null)
                throw new Exception("Tour guide not found.");

            decimal pricePerDay = guide.PriceOfDay;
            int totalDays;
            string planName;

            if (dto.AiPlanId.HasValue)
            {
                var aiPlan = await _unitOfWork.AiPlans.GetByIdAsync(dto.AiPlanId.Value);
                if (aiPlan == null) throw new Exception("AI plan not found.");
                totalDays = aiPlan.CountDay;
                planName = aiPlan.Name;
            }
            else if (dto.ManualPlanId.HasValue)
            {
                var manualPlan = await _unitOfWork.ManualPlans.GetByIdAsync(dto.ManualPlanId.Value);
                if (manualPlan == null) throw new Exception("Manual plan not found.");

                var planItems = await _unitOfWork.ManualPlanItems
                    .FindAsync(i => i.ManualPlanId == dto.ManualPlanId.Value);

                if (!planItems.Any())
                    throw new Exception("This manual plan has no places.");

                totalDays = planItems.Max(i => i.DayNumber);
                planName = manualPlan.Name;
            }
            else
            {
                throw new ArgumentException("You must select one plan.");
            }

            if (totalDays <= 0)
                throw new Exception("Invalid trip duration.");

            decimal totalPrice = pricePerDay * totalDays;

            var booking = new Booking(
                touristId,
                dto.GuideId,
                totalPrice,
                dto.AiPlanId,
                dto.ManualPlanId
            );

            await _unitOfWork.Bookings.AddAsync(booking);
            await _unitOfWork.CompleteAsync();

            // Notify the guide in real time.
            var tourist = await _unitOfWork.Users.GetByIdAsStringAsync(touristId);
            await PushBookingEventAsync(dto.GuideId, "BookingRequested", new
            {
                bookingId = booking.Id,
                touristId,
                touristName = tourist?.UserName ?? "A traveler",
                planName,
                totalPrice,
                state = "Pending",
                createdAt = booking.CreatedAt
            });

            return booking.Id;
        }

        public async Task<IEnumerable<GuideBookingDisplayDto>> GetPendingBookingsForGuideAsync(string guideId)
        {
            var bookings = await _unitOfWork.Bookings.FindAsyncInclude(
                b => b.GuideId == guideId && b.State == "Pending",
                b => b.Tourist.User, b => b.AiPlan, b => b.ManualPlan);

            return bookings.Select(b => new GuideBookingDisplayDto
            {
                BookingId = b.Id,
                TouristName = b.Tourist.User.UserName,
                TouristCountry = b.Tourist.User.Country,
                TouristProfileUrl = b.Tourist.User.UrlProfile,
                TotalPrice = b.TotalPrice,
                TouristRate = b.Tourist.Rate,
                PlanName = b.AiPlan != null ? b.AiPlan.Name : (b.ManualPlan != null ? b.ManualPlan.Name : "Unnamed plan"),
                CreatedAt = b.CreatedAt,
                BookingState = b.State
            }).ToList();
        }

        public async Task<bool> AcceptBookingAsync(Guid bookingId, string guideId)
        {
            var booking = await _unitOfWork.Bookings.GetByIdWithIncludesAsync(b => b.Id == bookingId, b => b.Guide.User);
            if (booking == null || booking.GuideId != guideId) return false;

            booking.AcceptBooking();
            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.CompleteAsync();

            // Notify the tourist in real time.
            await PushBookingEventAsync(booking.TouristId, "BookingStateChanged", new
            {
                bookingId = booking.Id,
                guideId,
                guideName = booking.Guide?.User?.UserName ?? "Your guide",
                state = "Accepted",
                changedAt = DateTime.UtcNow
            });

            return true;
        }

        public async Task<bool> RejectBookingAsync(Guid bookingId, string guideId)
        {
            var booking = await _unitOfWork.Bookings.GetByIdWithIncludesAsync(b => b.Id == bookingId, b => b.Guide.User);
            if (booking == null || booking.GuideId != guideId) return false;

            if (booking.State == "Accepted")
            {
                var g = await _unitOfWork.TourGuides.GetByIdAsStringAsync(guideId);
                g.AddStrike();
                _unitOfWork.TourGuides.Update(g);
            }

            booking.RejectBooking();
            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.CompleteAsync();

            await PushBookingEventAsync(booking.TouristId, "BookingStateChanged", new
            {
                bookingId = booking.Id,
                guideId,
                guideName = booking.Guide?.User?.UserName ?? "Your guide",
                state = "Cancelled",
                changedAt = DateTime.UtcNow
            });

            return true;
        }

        public async Task<BookingPlanDetailsDto> GetBookingPlanDetailsAsync(Guid bookingId, string guideId)
        {
            var booking = await _unitOfWork.Bookings.GetByIdWithIncludesAsync(b => b.Id == bookingId, b => b.Guide);
            if (booking == null || booking.GuideId != guideId)
                throw new Exception("Booking not found or you do not have access.");

            var result = new BookingPlanDetailsDto();

            if (booking.AiPlanId.HasValue)
            {
                var aiPlan = await _unitOfWork.AiPlans.GetByIdAsync(booking.AiPlanId.Value);
                result.PlanName = aiPlan.Name;
                result.PlanType = "AI";
                result.TotalDays = aiPlan.CountDay;

                // 1. فك الـ JSON اللي راجع من الـ AI
                if (!string.IsNullOrEmpty(aiPlan.AiResponseJson))
                {
                    // افترضنا إنك هتعمل Class صغير فوق يمثل الـ Item اللي راجع من الـ AI
                    var aiItems = JsonSerializer.Deserialize<List<AiPlanJsonItem>>(aiPlan.AiResponseJson);

                    if (aiItems != null && aiItems.Any())
                    {
                        // 2. هات الـ IDs بتاعت الأماكن اللي راجعة من الموديل
                        var placeIdsFromModel = aiItems.Select(i => i.place_id).ToHashSet();

                        // 3. هات الأماكن دي من الداتا بيز بناءً على الـ IdFromModel
                        // (تأكد إن اسم البروبرتي عندك في الـ Entity هو IdFromModel أو حسب ما أنت مسميه)
                        var matchedPlaces = await _unitOfWork.Places.FindAsync(p => placeIdsFromModel.Contains(p.IdFromModel));
                        var placeLookup = matchedPlaces.ToDictionary(p => p.IdFromModel);

                        // 4. عبي الـ Items في نفس الـ List اللي الفرونت إند متعود عليها
                        foreach (var item in aiItems)
                        {
                            placeLookup.TryGetValue(item.place_id, out var place);
                            result.ManualPlanItems.Add(new DailyPlanItemDto
                            {
                                DayNumber = item.day,
                                PlaceName = place?.Name ?? "Unknown place",
                                // يفضل كمان تبعت الـ PlaceId العادي والـ ImageUrl لو موجودين في الـ DTO
                                PlaceId = place?.Id,
                                ImageUrl = place?.MainImageUrl
                            });
                        }
                    }
                }
            }
            else if (booking.ManualPlanId.HasValue)
            {
                var manualPlan = await _unitOfWork.ManualPlans.GetByIdAsync(booking.ManualPlanId.Value);
                result.PlanName = manualPlan.Name;
                result.PlanType = "Manual";
                result.StartDate = manualPlan.StartDate;

                var selectedItems = await _unitOfWork.ManualPlanItems
                    .FindAsync(i => i.ManualPlanId == booking.ManualPlanId.Value);

                result.TotalDays = selectedItems.Any() ? selectedItems.Max(i => i.DayNumber) : 0;

                var placeIds = selectedItems.Select(i => i.PlaceId).ToHashSet();
                var matchedPlaces = await _unitOfWork.Places.FindAsync(p => placeIds.Contains(p.Id));
                var placeLookup = matchedPlaces.ToDictionary(p => p.Id);

                foreach (var item in selectedItems)
                {
                    placeLookup.TryGetValue(item.PlaceId, out var place);
                    result.ManualPlanItems.Add(new DailyPlanItemDto
                    {
                        DayNumber = item.DayNumber,
                        PlaceName = place?.Name ?? "Unknown place",
                        PlaceId = place?.Id,
                        ImageUrl = place?.MainImageUrl
                        // يفضل تبعت الـ Id والصورة هنا كمان
                    });
                }
            }

            return result;
        }

        public async Task<bool> CancelBookingByTouristAsync(Guid bookingId, string touristId)
        {
            var booking = await _unitOfWork.Bookings.GetByIdWithIncludesAsync(b => b.Id == bookingId, b => b.Tourist.User);
            if (booking == null || booking.TouristId != touristId) return false;

            booking.CancelBooking();
            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.CompleteAsync();

            // Notify the guide that the tourist cancelled.
            await PushBookingEventAsync(booking.GuideId, "BookingStateChanged", new
            {
                bookingId = booking.Id,
                touristId,
                touristName = booking.Tourist?.User?.UserName ?? "A traveler",
                state = "Cancelled",
                changedAt = DateTime.UtcNow
            });

            return true;
        }

        public async Task<IEnumerable<MyBookingTouristBookingDisplayDto>> GetMyBookingsAsync(string touristId)
        {
            var bookings = await _unitOfWork.Bookings.FindAsyncInclude(
                b => b.TouristId == touristId,
                b => b.Guide.User, b => b.AiPlan, b => b.ManualPlan);

            return bookings.Select(b => new MyBookingTouristBookingDisplayDto
            {
                BookingId = b.Id,
                GuideId = b.GuideId,
                GuideName = b.Guide?.User?.UserName ?? "Unknown guide",
                GuideProfileImage = b.Guide?.User?.UrlProfile,
                PlanName = b.AiPlan != null ? b.AiPlan.Name : (b.ManualPlan != null ? b.ManualPlan.Name : "Unnamed plan"),
                TotalCost = b.TotalPrice,
                BookingDate = b.CreatedAt,
                State = b.State
            })
            .OrderByDescending(b => b.BookingDate)
            .ToList();
        }

        public async Task<IEnumerable<GuideBookingDisplayDto>> GetGuideBookingsHistoryAsync(string guideId)
        {
            var bookings = await _unitOfWork.Bookings.FindAsyncInclude(
                b => b.GuideId == guideId && (b.State == "Accepted" || b.State == "Completed"),
                b => b.ManualPlan, b => b.AiPlan, b => b.Tourist.User);

            return bookings.Select(b => new GuideBookingDisplayDto
            {
                BookingId = b.Id,
                TouristName = b.Tourist?.User?.UserName ?? "Unknown traveler",
                TouristCountry = b.Tourist?.User?.Country,
                TouristProfileUrl = b.Tourist?.User?.UrlProfile,
                TotalPrice = b.TotalPrice,
                PlanName = b.AiPlan != null ? b.AiPlan.Name : (b.ManualPlan != null ? b.ManualPlan.Name : "Unnamed plan"),
                CreatedAt = b.CreatedAt,
                BookingState = b.State
            }).OrderByDescending(b => b.CreatedAt).ToList();
        }

        public async Task<bool> CompleteBookingAsync(Guid bookingId, string guideId)
        {
            var booking = await _unitOfWork.Bookings.GetByIdWithIncludesAsync(b => b.Id == bookingId, b => b.Guide.User);
            if (booking == null || booking.GuideId != guideId || booking.State != "Accepted")
                return false;

            booking.CompleteBooking();

            var guide = await _unitOfWork.TourGuides.GetByIdAsStringAsync(guideId);
            guide.AddDebt(booking.CommissionAmount);

            _unitOfWork.Bookings.Update(booking);
            _unitOfWork.TourGuides.Update(guide);
            await _unitOfWork.CompleteAsync();

            await PushBookingEventAsync(booking.TouristId, "BookingStateChanged", new
            {
                bookingId = booking.Id,
                guideId,
                guideName = booking.Guide?.User?.UserName ?? "Your guide",
                state = "Completed",
                changedAt = DateTime.UtcNow
            });

            return true;
        }

        public async Task<BookingPlanDetailsDto> GetBookingItineraryAsync(Guid bookingId, string userId)
        {
            var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
            if (booking == null)
                throw new KeyNotFoundException("Booking not found.");

            if (booking.TouristId != userId && booking.GuideId != userId)
                throw new UnauthorizedAccessException("You do not have access to this booking.");

            var result = new BookingPlanDetailsDto();

            if (booking.AiPlanId.HasValue)
            {
                var aiPlan = await _unitOfWork.AiPlans.GetByIdAsync(booking.AiPlanId.Value);
                if (aiPlan != null)
                {
                    result.PlanName = aiPlan.Name;
                    result.PlanType = "AI";
                    result.TotalDays = aiPlan.CountDay;
                    result.AiResponseJson = aiPlan.AiResponseJson;
                }
            }
            else if (booking.ManualPlanId.HasValue)
            {
                var manualPlan = await _unitOfWork.ManualPlans.GetByIdAsync(booking.ManualPlanId.Value);
                if (manualPlan != null)
                {
                    result.PlanName = manualPlan.Name;
                    result.PlanType = "Manual";
                    result.StartDate = manualPlan.StartDate;

                    var selectedItems = await _unitOfWork.ManualPlanItems
                        .FindAsync(i => i.ManualPlanId == booking.ManualPlanId.Value);

                    result.TotalDays = selectedItems.Any() ? selectedItems.Max(i => i.DayNumber) : 0;

                    var placeIds = selectedItems.Select(i => i.PlaceId).ToHashSet();
                    var matchedPlaces = await _unitOfWork.Places.FindAsync(p => placeIds.Contains(p.Id));
                    var placeLookup = matchedPlaces.ToDictionary(p => p.Id);

                    foreach (var item in selectedItems.OrderBy(i => i.DayNumber))
                    {
                        placeLookup.TryGetValue(item.PlaceId, out var place);
                        result.ManualPlanItems.Add(new DailyPlanItemDto
                        {
                            DayNumber = item.DayNumber,
                            PlaceName = place?.Name ?? "Unknown place",
                            ImageUrl = place?.MainImageUrl,
                            PlaceId = place?.Id
                        });
                    }
                }
            }

            return result;
        }
    }
}
