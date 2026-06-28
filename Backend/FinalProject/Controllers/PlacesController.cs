using BLL.ModelVm.Places;
using FinalProject.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlacesController : ControllerBase
    {
        private readonly IPlaceService _placeService;
        private readonly IFileService _fileService;
        private readonly IInteractionService _interactionService;

        public PlacesController(IPlaceService placeService, IFileService fileService, IInteractionService interactionService)
        {
            _placeService = placeService;
            _fileService = fileService;
            _interactionService = interactionService;
        }

        // ---------- Public browsing ----------
        [HttpGet]
        public async Task<IActionResult> GetAllPlaces()
        {
            var places = await _placeService.GetAllPlacesAsync();
            return Ok(new { IsSuccess = true, Data = places });
        }

        // Manual Plan flow: hits this when client passes a DB Guid in the route.
        // The {PlaceIdAI} segment is optional (defaults to 0); pass 0 for manual lookups.
        
        
        [HttpGet("{id:guid}/{PlaceIdAI:int}")]
        public async Task<IActionResult> GetPlaceById(Guid id, int PlaceIdAI)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var data = await _placeService.GetPlaceByIdAsync(id, PlaceIdAI, userId);
                if (data == null)
                    return NotFound(new { IsSuccess = false, Message = "Place not found." });
    
                return Ok(new { IsSuccess = true, Data = data });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        // AI Plan flow: only IdFromModel is known. The DB Guid is not in the URL.
        // Always queries `db.Places.FirstOrDefaultAsync(p => p.IdFromModel == aiPlaceId)`.
       
        
        [HttpGet("ai/{idAi:int}")]
        public async Task<IActionResult> GetPlaceByIdAi(int idAi)
        {
            try
            {
                var data = await _placeService.GetPlaceByIdAiPlan(idAi);
                if (data == null)
                    return NotFound(new { IsSuccess = false, Message = "Place not found." });
                return Ok(new { IsSuccess = true, Data = data });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [HttpGet("filter")]
        public async Task<IActionResult> FilterByType([FromQuery] string type)
        {
            if (string.IsNullOrWhiteSpace(type))
                return BadRequest(new { IsSuccess = false, Message = "Type is required." });
            return Ok(new { IsSuccess = true, Data = await _placeService.GetPlacesByTypeAsync(type) });
        }

        // ---------- Authenticated user actions ----------
        [HttpPost("{id}/add-photo")]
        [Authorize]
        public async Task<IActionResult> AddPhotoToPlace(Guid id, [FromForm] AddPhotoToPlace dto)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                await _placeService.AddUserPhotoToPlaceAsync(id, userId, dto.photoUrl);
   
                return StatusCode(StatusCodes.Status201Created,
                    new { IsSuccess = true, Message = "Photo added to place." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { IsSuccess = false, Message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { IsSuccess = false, Message = ex.Message }); }
        }

        // ---------- Admin-only management ----------
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddPlace([FromForm] CreatePlaceDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var data = await _placeService.AddPlaceAsync(dto);

                return StatusCode(StatusCodes.Status201Created, new { IsSuccess = true, Data = data });
            }
            catch (Exception ex) { return BadRequest(new { IsSuccess = false, Message = ex.Message }); }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePlace(Guid id, [FromForm] UpdatePlaceDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try { return Ok(new { IsSuccess = true, Data = await _placeService.UpdatePlaceAsync(id, dto) }); }
            catch (KeyNotFoundException ex) { return NotFound(new { IsSuccess = false, Message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { IsSuccess = false, Message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePlace(Guid id)
        {
            try
            {
                await _placeService.DeletePlaceAsync(id);
                return Ok(new { IsSuccess = true, Message = "Place deleted." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { IsSuccess = false, Message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { IsSuccess = false, Message = ex.Message }); }
        }

        [HttpDelete("{placeId}/photos/{photoId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUserPhoto(Guid placeId, Guid photoId)
        {
            try
            {
                await _placeService.DeleteUserPhotoAsync(photoId);
                return Ok(new { IsSuccess = true, Message = "Photo deleted." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { IsSuccess = false, Message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { IsSuccess = false, Message = ex.Message }); }
        }
        }
    }
