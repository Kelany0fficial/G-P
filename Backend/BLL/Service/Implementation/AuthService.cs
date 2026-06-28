using BLL.Helper;
using BLL.ModelVm;
using BLL.ModelVm.Account;
using BLL.ModelVm.GuideVm;
using BLL.ModelVm.Response;
using BLL.Service.Abstraction;
using DAL.Entity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly DAL.DataApp.AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IFileService _fileService;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _cache;

        public AuthService(UserManager<AppUser> userManager, DAL.DataApp.AppDbContext context, IConfiguration configuration, IFileService fileService, IEmailService emailService, IMemoryCache cache)
        {
            _userManager = userManager;
            _context = context;
            _configuration = configuration;
            _fileService = fileService;
            _emailService = emailService;
            _cache = cache;
        }

        public async Task<Response<LoginResponseDto>> Login(LoginVm model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return new Response<LoginResponseDto>(null, false, "Invalid Email or Password.", null);

            // Ban check
            if (user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow)
            {
                return new Response<LoginResponseDto>(null, false, "Your account has been suspended by an administrator.", null);
            }

            // Email confirmation
            if (!user.EmailConfirmed)
            {
                return new Response<LoginResponseDto>(null, false, "Your account is not activated. Please verify the OTP sent to your email.", null);
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, model.Password);
            if (!isPasswordValid)
                return new Response<LoginResponseDto>(null, false, "Invalid Email or Password.", null);

            var userRoles = await _userManager.GetRolesAsync(user);
            var primaryRole = userRoles.FirstOrDefault() ?? string.Empty;

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = GenerateNewJsonWebToken(authClaims);

            var payload = new LoginResponseDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                Role = primaryRole,
                ProfileImageUrl = user.UrlProfile,
                Token = token
            };

            return new Response<LoginResponseDto>(payload, true, "Login successful.", token);
        }

        public async Task<Response<RegisterGuideDto>> RegisterGuideAsync(RegisterGuideDto model)
        {
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
                return new Response<RegisterGuideDto>(null, false, "Email already exists.", null);

            string nationalIdUrl = null;
            string profileUrl = null;

            try
            {
                if (model.NationalIdImage != null)
                {
                    nationalIdUrl = await _fileService.UploadFileAsync(model.NationalIdImage, "Files/images/national-ids");
                }
                else
                {
                    return new Response<RegisterGuideDto>(null, false, "National ID Image is required.", null);
                }

                if (model.ProfileImageFile != null)
                {
                    profileUrl = await _fileService.UploadFileAsync(model.ProfileImageFile, "Files/images/profiles");
                }
            }
            catch (Exception ex)
            {
                return new Response<RegisterGuideDto>(null, false, $"Error uploading files: {ex.Message}", null);
            }

            var user = new AppUser(model.UserName, model.Email, model.Age, model.Country, model.Gender, profileUrl);
            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                _fileService.DeleteFile(nationalIdUrl);
                if (profileUrl != null) _fileService.DeleteFile(profileUrl);

                return new Response<RegisterGuideDto>(null, false, "Guide registration failed.", null);
            }

            await _userManager.AddToRoleAsync(user, AppRoles.Guide);

            var guideProfile = new TourGuide(user.Id, nationalIdUrl, model.ResolveLanguageCsv(), model.PriceOfDay, model.Bio);
            _context.TourGuides.Add(guideProfile);
            await _context.SaveChangesAsync();

            // إرسال الـ OTP باستخدام الدالة الموحدة المساعدة
            bool emailSent = await SendActivationOtpAsync(user, "أهلاً بك معنا في Ather!", "شكراً لتسجيلك في المنصة. يرجى استخدام كود التحقق التالي لتفعيل حسابك:");

            if (!emailSent)
            {
                return new Response<RegisterGuideDto>(null, true, "Guide registered successfully, but failed to send OTP email. Please request a new OTP.", null);
            }

            return new Response<RegisterGuideDto>(null, true, "Guide registered successfully. Please verify your email with the OTP sent to your inbox. Pending admin approval.", null);
        }

        public async Task<Response<RegisterTourist>> RegisterTourist(RegisterTourist model)
        {
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
                return new Response<RegisterTourist>(null, false, "Email already exists.", null);

            string profileUrl = null;
            try
            {
                if (model.UrlProfile != null)
                {
                    profileUrl = await _fileService.UploadFileAsync(model.UrlProfile, "images/profiles");
                }
            }
            catch (Exception ex)
            {
                return new Response<RegisterTourist>(null, false, $"Error uploading profile image: {ex.Message}", null);
            }

            var user = new AppUser(model.UserName, model.Email, model.Age, model.Country, model.Gender, profileUrl);
            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                if (profileUrl != null) _fileService.DeleteFile(profileUrl);
                return new Response<RegisterTourist>(null, false, "User registration failed.", null);
            }

            await _userManager.AddToRoleAsync(user, AppRoles.Tourist);

            var touristProfile = new Tourist(user.Id, model.UserName, model.ResolveLanguageCsv());
            _context.Tourists.Add(touristProfile); // تأكد من اسم الجدول لديك لتفادي الأخطاء
            await _context.SaveChangesAsync();

            // إرسال الـ OTP باستخدام الدالة الموحدة المساعدة
            string welcomeHeading = $"أهلاً بك يا {user.UserName} في Ather!";
            bool emailSent = await SendActivationOtpAsync(user, welcomeHeading, "يسعدنا انضمامك إلينا. يرجى استخدام كود التحقق التالي لتفعيل حسابك والبدء في تخطيط رحلاتك:");

            if (!emailSent)
            {
                return new Response<RegisterTourist>(null, true, "Tourist registered successfully, but failed to send OTP email. Please request a new OTP.", null);
            }

            return new Response<RegisterTourist>(null, true, "Tourist registered successfully. Please verify your email with the OTP sent to your inbox.", null);
        }

        public async Task<Response<bool>> VerifyRegistrationOtpAsync(VerifyOtpDto dto)
        {
            if (!_cache.TryGetValue(GetRegisterOtpKey(dto.Email), out string savedOtp))
                return new Response<bool>(false, false, "كود التحقق منتهي الصلاحية، يرجى إعادة طلب كود جديد.", null);

            if (savedOtp != dto.Otp)
                return new Response<bool>(false, false, "كود التحقق غير صحيح.", null);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return new Response<bool>(false, false, "المستخدم غير موجود.", null);
            if (user.EmailConfirmed)
                return new Response<bool>(false, false, "هذا الحساب مفعل بالفعل.", null);

            user.EmailConfirmed = true;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                _cache.Remove(GetRegisterOtpKey(dto.Email));
                return new Response<bool>(true, true, "تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.", null);
            }

            return new Response<bool>(false, false, "حدث خطأ أثناء حفظ التفعيل: " + string.Join(", ", result.Errors.Select(e => e.Description)), null);
        }

        public async Task<Response<bool>> ResendConfirmationOtpAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return new Response<bool>(false, false, "المستخدم غير موجود.", null);
            if (user.EmailConfirmed)
                return new Response<bool>(false, false, "هذا الحساب مفعل بالفعل، يمكنك تسجيل الدخول مباشرة.", null);

            string otp = GenerateOtp.GenerateOtpFor();
            _cache.Set(GetRegisterOtpKey(email), otp, TimeSpan.FromMinutes(10));

            string subject = "إعادة إرسال كود تفعيل الحساب - Ather";
            string body = $@"
            <div style='text-align: right; font-family: Tahoma; direction: rtl; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                <h3 style='color: #C9A84C;'>مرحباً بك مجدداً في Ather</h3>
                <p>لقد طلبت إعادة إرسال كود التفعيل لحسابك المعلق. كود التحقق الجديد (OTP) هو:</p>
                <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #C9A84C; border-radius: 5px;'>
                    {otp}
                </div>
                <p style='color: #6c757d; font-size: 12px; margin-top: 20px;'>هذا الكود صالح لمدة 10 دقائق فقط.</p>
            </div>";

            try
            {
                await _emailService.SendEmailAsync(user.Email, subject, body);
                return new Response<bool>(true, true, "تم إعادة إرسال كود التفعيل (OTP) إلى بريدك الإلكتروني بنجاح.", null);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"فشل إعادة إرسال الـ OTP: {ex.Message}");
                return new Response<bool>(false, false, "حدث خطأ أثناء إرسال الإيميل، يرجى المحاولة مرة أخرى.", null);
            }
        }

        public async Task<Response<bool>> ForgetPasswordAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return new Response<bool>(true, true, "تم إرسال كود التحقق إذا كان الحساب مسجلاً لدينا.", null);

            string otp = GenerateOtp.GenerateOtpFor();
            _cache.Set(GetForgetPasswordOtpKey(email), otp, TimeSpan.FromMinutes(10));

            string subject = "إعادة تعيين كلمة المرور - كود الـ OTP";
            string body = $@"
            <div style='text-align: right; font-family: Tahoma; direction: rtl; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                <h3 style='color: #C9A84C;'>أهلاً بك يا {user.UserName}</h3>
                <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
                <p>كود التحقق الخاص بك (OTP) هو:</p>
                <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #dc3545; border-radius: 5px;'>
                    {otp}
                </div>
                <p style='color: #6c757d; font-size: 12px; margin-top: 20px;'>هذا الكود صالح لمدة 10 دقائق فقط. إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا الإيميل بأمان.</p>
            </div>";

            await _emailService.SendEmailAsync(user.Email, subject, body);
            return new Response<bool>(true, true, "تم إرسال كود التحقق (OTP) إلى بريدك الإلكتروني بنجاح.", null);
        }

        public async Task<Response<bool>> ResetPasswordWithOtpAsync(ResetPasswordDto dto)
        {
            var emailKey = dto.Email.ToLower();

            if (!_cache.TryGetValue(GetForgetPasswordOtpKey(emailKey), out string savedOtp))
                return new Response<bool>(false, false, "كود التحقق منتهي الصلاحية أو غير صحيح. يرجى طلب كود جديد.", null);

            if (savedOtp != dto.Otp)
                return new Response<bool>(false, false, "كود التحقق غير صحيح.", null);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return new Response<bool>(false, false, "المستخدم غير موجود.", null);

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, dto.NewPassword);

            if (result.Succeeded)
            {
                _cache.Remove(GetForgetPasswordOtpKey(emailKey));
                return new Response<bool>(true, true, "تم تغيير كلمة المرور بنجاح.", null);
            }

            return new Response<bool>(false, false, "فشل في تغيير كلمة المرور: " + string.Join(", ", result.Errors.Select(e => e.Description)), null);
        }

        // ==========================================
        // الدوال المساعدة الخاصة (Private Methods)
        // ==========================================

        private string GenerateNewJsonWebToken(List<Claim> claims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]));

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                expires: DateTime.UtcNow.AddDays(14),
                claims: claims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<bool> SendActivationOtpAsync(AppUser user, string heading, string messageBody)
        {
            string otp = GenerateOtp.GenerateOtpFor();
            _cache.Set(GetRegisterOtpKey(user.Email), otp, TimeSpan.FromMinutes(10));

            string subject = "تأكيد البريد الإلكتروني - Ather";
            string body = $@"
            <div style='text-align: right; font-family: Tahoma; direction: rtl; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                <h3 style='color: #C9A84C;'>{heading}</h3>
                <p>{messageBody}</p>
                <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #198754; border-radius: 5px;'>
                    {otp}
                </div>
                <p style='color: #6c757d; font-size: 12px; margin-top: 20px;'>هذا الكود صالح لمدة 10 دقائق فقط.</p>
            </div>";

            try
            {
                await _emailService.SendEmailAsync(user.Email, subject, body);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"فشل إرسال إيميل الـ OTP لـ {user.Email}: {ex.Message}");
                return false;
            }
        }

        private string GetRegisterOtpKey(string email)
        {
            return $"RegisterOTP_{email.ToLower()}";
        }

        private string GetForgetPasswordOtpKey(string email)
        {
            return $"ForgetOTP_{email.ToLower()}";
        }
    }
}