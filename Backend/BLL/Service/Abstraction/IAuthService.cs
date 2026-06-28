
using BLL.ModelVm;
using BLL.ModelVm.Account;
using BLL.ModelVm.GuideVm;
using BLL.ModelVm.Response;
using DAL.Entity;


namespace BLL.Service.Abstraction
{
    public interface IAuthService
    {

       Task<Response<LoginResponseDto>> Login(LoginVm model);
        Task<Response<RegisterTourist>> RegisterTourist(RegisterTourist model);
        Task<Response<RegisterGuideDto>> RegisterGuideAsync(RegisterGuideDto model);
        Task<Response<bool>> ForgetPasswordAsync(string email);
        Task<Response<bool>> ResetPasswordWithOtpAsync(ResetPasswordDto dto);
        Task<Response<bool>> VerifyRegistrationOtpAsync(VerifyOtpDto dto);
        Task<Response<bool>> ResendConfirmationOtpAsync(string email);

    }
}
