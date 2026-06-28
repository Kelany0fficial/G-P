using BLL.ModelVm.Booking;
using BLL.Service.Abstraction;
using FinalProject.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingsController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        // Tourist creates a booking request
        [Authorize(Roles = "Tourist")]
        [HttpPost("request")]
        public async Task<IActionResult> RequestBooking([FromBody] CreateBookingDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var bookingId = await _bookingService.CreateBookingRequestAsync(dto, touristId);
                return CreatedAtAction(nameof(GetMyBookings), new { },
                    new { IsSuccess = true, BookingId = bookingId, Message = "Booking request submitted; pending guide approval." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [Authorize(Roles = "Tourist")]
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(Guid id)
        {
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var result = await _bookingService.CancelBookingByTouristAsync(id, touristId);
            if (!result)
                return NotFound(new { IsSuccess = false, Message = "Booking not found or you do not own it." });

            return Ok(new { IsSuccess = true, Message = "Booking cancelled successfully." });
        }

        [Authorize(Roles = "Tourist")]
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            if (!User.TryGetUserId(out var touristId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var bookings = await _bookingService.GetMyBookingsAsync(touristId);
            return Ok(new { IsSuccess = true, Data = bookings });
        }

        [Authorize(Roles = "Guide")]
        [HttpGet("guide/pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var bookings = await _bookingService.GetPendingBookingsForGuideAsync(guideId);
            return Ok(new { IsSuccess = true, Data = bookings });
        }

        [Authorize(Roles = "Guide")]
        [HttpGet("guide/history")]
        public async Task<IActionResult> GetGuideHistory()
        {
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var bookings = await _bookingService.GetGuideBookingsHistoryAsync(guideId);
            return Ok(new { IsSuccess = true, Data = bookings });
        }

        [Authorize(Roles = "Guide")]
        [HttpPut("guide/{id}/accept")]
        public async Task<IActionResult> AcceptBooking(Guid id)
        {
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var result = await _bookingService.AcceptBookingAsync(id, guideId);
            if (!result)
                return NotFound(new { IsSuccess = false, Message = "Booking not found or not in pending state." });
            return Ok(new { IsSuccess = true, Message = "Booking accepted." });
        }

        [Authorize(Roles = "Guide")]
        [HttpPut("guide/{id}/reject")]
        public async Task<IActionResult> RejectBooking(Guid id)
        {
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var result = await _bookingService.RejectBookingAsync(id, guideId);
            if (!result)
                return NotFound(new { IsSuccess = false, Message = "Booking not found or you cannot reject it." });
            return Ok(new { IsSuccess = true, Message = "Booking rejected." });
        }

        [Authorize(Roles = "Guide")]
        [HttpPut("guide/{id}/complete")]
        public async Task<IActionResult> CompleteBooking(Guid id)
        {
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var result = await _bookingService.CompleteBookingAsync(id, guideId);
            if (!result)
                return NotFound(new { IsSuccess = false, Message = "Booking not found or not in an acceptable state." });
            return Ok(new { IsSuccess = true, Message = "Trip completed and commission applied." });
        }

        // Itinerary accessible to either booking participant (tourist or guide).
        [Authorize(Roles = "Tourist,Guide")]
        [HttpGet("{id}/MyBookingDetails")]
        public async Task<IActionResult> GetItinerary(Guid id)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var data = await _bookingService.GetBookingPlanDetailsAsync(id, userId);
                return Ok(new { IsSuccess = true, Data = data });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { IsSuccess = false, Message = ex.Message });
            }
        }
    }
}
