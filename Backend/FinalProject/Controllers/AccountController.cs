using BLL.ModelVm;
using BLL.ModelVm.Account;
using BLL.ModelVm.GuideVm;
using DAL.Entity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly BLL.Service.Abstraction.IAuthService _authService;

        public AccountController(BLL.Service.Abstraction.IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginVm model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.Login(model);
            if (result.IsSuccess)
                return Ok(result);

            return Unauthorized(result);
        }

        [HttpPost("register-tourist")]
        public async Task<IActionResult> RegisterTourist([FromForm] RegisterTourist model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterTourist(model);
            if (result.IsSuccess)
                return StatusCode(StatusCodes.Status201Created, result);

            return BadRequest(result);
        }

        [HttpPost("register-guide")]
        public async Task<IActionResult> RegisterGuide([FromForm] RegisterGuideDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterGuideAsync(model);
            if (result.IsSuccess)
                return StatusCode(StatusCodes.Status201Created, result);

            return BadRequest(result);
        }

        [HttpPost("forget-password")]
        public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { IsSuccess = false, Message = "Email is required." });

            var result = await _authService.ForgetPasswordAsync(dto.Email);
            return Ok(result);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _authService.ResetPasswordWithOtpAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyOtpDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _authService.VerifyRegistrationOtpAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("resend-activation-otp")]
        public async Task<IActionResult> ResendActivationOtp([FromBody] ForgetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { IsSuccess = false, Message = "Email is required." });

            var result = await _authService.ResendConfirmationOtpAsync(dto.Email);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
