using BLL.ModelVm.Payment;
using FinalProject.Common;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GuidesController : ControllerBase
    {
        private readonly IGuideService _guideService;
        private readonly IPaymentService _paymentService;

        public GuidesController(IGuideService guideService, IPaymentService paymentService)
        {
            _guideService = guideService;
            _paymentService = paymentService;
        }

        // List all active (approved) guides — any authenticated user
        [Authorize]
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveGuides()
        {
            var guides = await _guideService.GetActiveGuidesAsync();
            return Ok(new { IsSuccess = true, Data = guides });
        }

        // Public details of one guide — accessible to any authenticated user
        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetGuideDetails(string id)
        {
            try
            {
                var guide = await _guideService.GetGuideByIdAsync(id);
                if (guide == null)
                    return NotFound(new { IsSuccess = false, Message = "Guide not found." });
                return Ok(new { IsSuccess = true, Data = guide });
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

        [Authorize(Roles = "Guide")]
        [HttpPut("Update-my-profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateGuideProfileDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var result = await _guideService.UpdateGuideProfileAsync(guideId, dto);
            if (!result) return BadRequest(new { IsSuccess = false, Message = "Failed to update profile." });
            return Ok(new { IsSuccess = true, Message = "Profile updated successfully." });
        }

        [Authorize(Roles = "Guide")]
        [HttpGet("my-wallet")]
        public async Task<IActionResult> GetMyWallet()
        {
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });
            try
            {
                var wallet = await _guideService.GetGuideWalletAsync(guideId);
                return Ok(new { IsSuccess = true, Data = wallet });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { IsSuccess = false, Message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { IsSuccess = false, Message = ex.Message }); }
        }

        [Authorize(Roles = "Guide")]
        [HttpPost("pay-dues")]
        public async Task<IActionResult> PayPlatformDues([FromBody] ProcessPaymentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            var result = await _paymentService.PayGuideDuesAsync(guideId, dto);
            if (!result.IsSuccess)
                return BadRequest(new { IsSuccess = false, Message = result.Message });

            string statusMessage = result.Message;
            if (result.NewWalletBalance > 0)
                statusMessage += $" Outstanding balance cleared; {result.NewWalletBalance} credited to your wallet.";
            else if (result.NewOutstandingBalance > 0)
                statusMessage += $" Remaining debt: {result.NewOutstandingBalance}.";
            else
                statusMessage += " Your balance is now zero.";

            return Ok(new
            {
                IsSuccess = true,
                Message = statusMessage,
                Data = new
                {
                    OutstandingBalance = result.NewOutstandingBalance,
                    WalletBalance = result.NewWalletBalance
                }
            });
        }

        [Authorize(Roles = "Guide,Admin")]
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });
            try
            {
                var profile = await _guideService.GetMyProfileAsync(guideId);
                if (profile == null) return NotFound(new { IsSuccess = false, Message = "Profile not found." });
                return Ok(new { IsSuccess = true, Data = profile });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return NotFound(new { IsSuccess = false, Message = ex.Message });
            }
        }

        [Authorize(Roles = "Guide")]
        [HttpPut("profile-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProfileImage([FromForm] UpdateProfileImageGuid profileImage)
        {
            if (profileImage?.profileImage == null || profileImage.profileImage.Length == 0)
                return BadRequest(new { IsSuccess = false, Message = "A valid image file is required." });

            if (!User.TryGetUserId(out var guideId))
                return Unauthorized(new { IsSuccess = false, Message = "Unauthenticated." });

            try
            {
                var newImageUrl = await _guideService.UpdateProfileImageAsync(guideId, profileImage.profileImage);
                return Ok(new { IsSuccess = true, Message = "Profile image updated.", ImageUrl = newImageUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { IsSuccess = false, Message = ex.Message });
            }
        }
    }
}
