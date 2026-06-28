using BLL.ModelVm.AiPlane;
using BLL.ModelVm.Manual;
using BLL.ModelVm.TouristVm;
using DAL.Entity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BLL.Service.Implementation
{
    public class PlanService : IPlanService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAiIntegrationService _aiService;

        public PlanService(IUnitOfWork unitOfWork, IAiIntegrationService aiService)
        {
            _unitOfWork = unitOfWork;
            _aiService = aiService;
        }

        public async Task<Guid> CreateAndSavePlanAsync(CreatePlanDto dto, string userId)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var plan = new AiPlan(dto.Name, dto.Description, dto.CountDay, dto.Budget, dto.Type, userId);

            var aiResult = await _aiService.GetPlanFromPythonApi(dto.CountDay, dto.Budget, dto.Type,dto.Governorate);
            plan.SetAiResponse(aiResult);

            await _unitOfWork.AiPlans.AddAsync(plan);

            var places = JsonSerializer.Deserialize<List<AiPlacePlanDto>>(aiResult);

            foreach (var place in places)
            {
                var dbPlace = (await _unitOfWork.Places.FindAsync(
                    p => p.IdFromModel == place.PlaceId))
                    .FirstOrDefault();

                if (dbPlace != null)
                {
                    //await _unitOfWork.UserPlaceInteractions.AddAsync(
                    //    new UserPlaceInteraction
                    //    (
                    //         userId,
                    //       dbPlace.IdFromModel, // Guid من قاعدة البيانات
                    //         "trip"
                           
                    //    ));
                }
            }


                await _unitOfWork.CompleteAsync();
           

            return plan.Id;
        }

        public async Task<Guid> CreateManualPlanAsync(CreateManualPlanDto dto, string touristId)
        {
            if (dto.SelectedPlaces == null || !dto.SelectedPlaces.Any())
                throw new Exception("Cannot create a plan without selecting places.");

            var plan = new ManualPlan(dto.Name, dto.StartDate, touristId);
            await _unitOfWork.ManualPlans.AddAsync(plan);

            foreach (var item in dto.SelectedPlaces)
            {
                var placeExists = await _unitOfWork.Places.GetByIdAsync(item.PlaceId);
                if (placeExists == null)
                    throw new KeyNotFoundException($"Place with ID {item.PlaceId} not found.");

                var planItem = new ManualPlanItem(plan.Id, item.PlaceId, item.DayNumber);
                await _unitOfWork.ManualPlanItems.AddAsync(planItem);
                //await _unitOfWork.UserPlaceInteractions.AddAsync(
        //new UserPlaceInteraction
        //(
        //    touristId,
        //     placeExists.IdFromModel,
        //     "trip"
             
        //));
            }

            await _unitOfWork.CompleteAsync();
            return plan.Id;
        }

        /// <summary>
        /// AI Plan details — joins the AI response (IdFromModel) with the DB Places table.
        /// Each itinerary item carries IdFromModel so the frontend can route to /explore/ai/{IdFromModel}.
        /// </summary>
        public async Task<AiPlanDetailedDisplayDto> GetAiPlanDetailsAsync(Guid planId, string touristId)
        {
            var plan = await _unitOfWork.AiPlans.GetByIdAsync(planId);
            if (plan == null || plan.TouristId != touristId)
                throw new KeyNotFoundException("Plan not found or you are not authorized to view it.");

            List<PythonAiResponseItem> parsedAiItems;
            try
            {
                parsedAiItems = JsonSerializer.Deserialize<List<PythonAiResponseItem>>(plan.AiResponseJson)
                                ?? new List<PythonAiResponseItem>();
            }
            catch
            {
                throw new Exception("Failed to parse the AI response.");
            }

            var uniqueAiIds = parsedAiItems.Select(x => x.PlaceId).Distinct().ToList();

            // AI plan ALWAYS joins on IdFromModel — never on DB Id.
            var placesFromDb = await _unitOfWork.Places.FindAsync(p => uniqueAiIds.Contains(p.IdFromModel));

            return new AiPlanDetailedDisplayDto
            {
                Id = plan.Id,
                Name = plan.Name,
                CountDay = plan.CountDay,
                Budget = plan.Budget,
                CreatedAt = plan.CreatedAt,
                PlanItinerary = parsedAiItems.Select(aiItem =>
                {
                    var dbPlace = placesFromDb.FirstOrDefault(p => p.IdFromModel == aiItem.PlaceId);
                    return new AiPlanItemDetailedDto
                    {
                        DayNumber = aiItem.DayNumber,
                        PlaceId = aiItem.PlaceId, // IdFromModel — frontend uses this with /Places/ai/{id}
                        PlaceName = dbPlace?.Name ?? "Place unavailable",
                        Description = dbPlace?.Description ?? "No description available.",
                        ImageUrl = dbPlace?.MainImageUrl ?? "",
                        TicketPrice = dbPlace?.TicketPrice ?? 0
                    };
                })
                .OrderBy(x => x.DayNumber)
                .ToList()
            };
        }

        public async Task<IEnumerable<AiPlanDisplayDto>> GetMyAiPlansAsync(string touristId)
        {
            var allAiPlans = await _unitOfWork.AiPlans.FindAsync(p => p.TouristId == touristId);

            return allAiPlans.Select(p => new AiPlanDisplayDto
            {
                Id = p.Id,
                Name = p.Name,
                CountDay = p.CountDay,
                Budget = p.Budget,
                Type = p.Type,
                CreatedAt = p.CreatedAt,
                AiResponse = p.AiResponseJson
            })
            .OrderByDescending(p => p.CreatedAt)
            .ToList();
        }

        public async Task<IEnumerable<ManualPlanDisplayDto>> GetMyManualPlansAsync(string touristId)
        {
            var allManualPlans = await _unitOfWork.ManualPlans.FindAsyncInclude(
                p => p.TouristId == touristId,
                p => p.Include(m => m.Items).ThenInclude(i => i.Place));

            return allManualPlans.Select(p => new ManualPlanDisplayDto
            {
                Id = p.Id,
                Name = p.Name,
                StartDate = p.StartDate,
                CreatedAt = p.CreatedAt,
                Places = p.Items.Select(i => new BLL.ModelVm.TouristVm.ManualPlanItemDto
                {
                    PlaceId = i.PlaceId, // DB Guid — frontend uses /explore/{id}
                    PlaceName = i.Place?.Name ?? "Unknown place",
                    DayNumber = i.DayNumber,
                    ImageUrl = i.Place?.MainImageUrl
                }).ToList()
            })
            .OrderByDescending(p => p.CreatedAt)
            .ToList();
        }
    }
}
