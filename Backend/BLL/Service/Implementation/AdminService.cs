using BLL.ModelVm.Admin;
using DAL.Entity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class AdminService : IAdminService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;
        private readonly UserManager<AppUser> _userManager;
        private readonly DAL.DataApp.AppDbContext _context;



        public AdminService(IUnitOfWork unitOfWork, IEmailService emailService, UserManager<AppUser> userManager, DAL.DataApp.AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _userManager = userManager;
            _context = context;
        }



        public async Task<IEnumerable<PendingGuideDto>> GetPendingGuidesAsync()
        {
            // بنجيب المرشدين اللي الـ State بتاعتهم false (لسه متوافقش عليهم)
            var pendingGuides = await _unitOfWork.TourGuides.FindAsyncInclude(
 g => g.State == false,
 g => g.User // عشان نجيب اسمه وإيميله
            );



            return pendingGuides.Select(g => new PendingGuideDto
            {
                GuideId = g.GuideId,
                UserName = g.User?.UserName ?? "غير معروف",
                Email = g.User?.Email ?? "غير معروف",
                NationalIdImage = g.NationalIdImage,
                Language = g.Language,
                Bio = g.Bio,
                PriceOfDay = g.PriceOfDay
            }).ToList();
        }



        public async Task<bool> ApproveGuideAsync(string guideId)
        {
            var guide = await _unitOfWork.TourGuides.FindAsyncInclude(
            g => g.GuideId == guideId,
            g => g.User
            );
            var targetGuide = guide.FirstOrDefault();



            if (targetGuide == null) throw new Exception("المرشد غير موجود.");

            if(targetGuide.State == true) throw new Exception("المرشد ده متفعل أصلاً.");

            targetGuide.ActivateGuide();
            _unitOfWork.TourGuides.Update(targetGuide);
            await _unitOfWork.CompleteAsync();



            // 2. إرسال إيميل التفعيل للمرشد
            string subject = "تم تفعيل حسابك في منصة السياحة 🎊";
            string body = $@"
<h1>مرحباً {targetGuide.User.UserName}،</h1>
<p>يسعدنا إبلاغك بأن الإدارة قد راجعت بياناتك وتم <b>تفعيل حسابك</b> كمرشد سياحي بنجاح.</p>
<p>يمكنك الآن استقبال طلبات الحجز ونشر قصصك (Stories) على المنصة.</p>
<br>
<p>نتمنى لك رحلات سعيدة!</p>";



            await _emailService.SendEmailAsync(targetGuide.User.Email, subject, body);



            return true;
        }



        public async Task<bool> RejectGuideAsync(string guideId)
        {
            var guide = await _unitOfWork.TourGuides.GetByIdAsStringAsync(guideId);
            if (guide == null) throw new Exception("المرشد غير موجود.");



            // لو اترفض، بنمسح ريكورد المرشد (عشان يقدر يقدم تاني لو حابب)
            // بس مش بنمسح الـ AppUser بتاعه، هيفضل مستخدم عادي في السيستم
            _unitOfWork.TourGuides.Delete(guide);
            await _unitOfWork.CompleteAsync();



            return true;
        }

        // ========================== قسم التقييمات ==========================
        public async Task<IEnumerable<ReviewModerationDto>> GetAllReviewsForModerationAsync()
        {
            // بنجيب كل التقييمات من الداتا بيز
            // استخدم FindAsync أو GetAllAsync المتاحة في الـ IUnitOfWork بتاعك
            var reviews = await _unitOfWork.Reviews.GetAllAsyncInclude(
                q => q.Include(r => r.Tourist).ThenInclude(t => t.User)
                      .Include(r => r.Place)
                      .Include(r => r.Guide).ThenInclude(g => g.User)
            ); // افترضنا إن فيه Navigation Properties هتيجي معاها أو عدلها حسب طريقتك



            return reviews.Select(r => new ReviewModerationDto
            {
                Id = r.Id,
                AuthorName = r.Tourist?.User?.UserName ?? "مجهول", // راجع أسماء العلاقات
                TargetName = r.Place?.Name ?? r.Guide.User?.UserName ?? "غير محدد",
                Rate = r.Rate,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).OrderByDescending(r => r.CreatedAt).ToList();
        }



        public async Task<bool> DeleteReviewAsync(Guid reviewId)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null) return false;



            _unitOfWork.Reviews.Delete(review);
            await _unitOfWork.CompleteAsync();
            return true;
        }



        // ========================== قسم الاستوريهات ==========================
        public async Task<IEnumerable<StoryModerationDto>> GetAllStoriesForModerationAsync()
        {
            var stories = await _unitOfWork.Stories.GetAllAsyncInclude(
                s => s.Include(st => st.User)
            );



            return stories.Select(s => new StoryModerationDto
            {
                Id = s.Id,
                GuideName = s.User?.UserName ?? "مجهول",
                MediaUrl = s.MediaUrl,
                Caption = s.Description,
                CreatedAt = s.CreatedAt
            }).OrderByDescending(s => s.CreatedAt).ToList();
        }



        public async Task<bool> DeleteStoryAsync(Guid storyId)
        {
            var story = await _unitOfWork.Stories.GetByIdAsync(storyId);
            if (story == null) return false;



            _unitOfWork.Stories.Delete(story);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<string> ToggleUserBanStatusAsync(string userId)
        {
            // 1. نجيب اليوزر من الداتا بيز
            var user = await _userManager.FindByIdAsync(userId);
            var tourguide = await _unitOfWork.TourGuides.GetByIdWithIncludesAsync(i => i.GuideId == userId, i => i.Include(t => t.Bookings));

            if (user == null) throw new KeyNotFoundException("User not found.");

            // 2. تفعيل خاصية الـ Lockout لليوزر
            await _userManager.SetLockoutEnabledAsync(user, true);

            string emailSubject = String.Empty;
            string emailBody = String.Empty;
            string returnMessage = String.Empty;

            // 3. نشوف هل هو محظور أصلاً ولا لأ
            if (user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow)
            {
                //  فك الحظر (بنخلي التاريخ null)
                await _userManager.SetLockoutEndDateAsync(user, null);
                if(tourguide != null)
                {
                    tourguide.ActivateGuide();
                    _unitOfWork.TourGuides.Update(tourguide);
                    await _unitOfWork.CompleteAsync();
                }

                // تجهيز إيميل فك الحظر
                emailSubject = "تم إعادة تفعيل حسابك - Egypt Tours";
                emailBody = $@"
            <div style='text-align: right; font-family: Tahoma; direction: rtl; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                <h3 style='color: #198754;'>مرحباً {user.UserName}،</h3>
                <p>يسعدنا إبلاغك بأنه قد تم <strong>إعادة تفعيل حسابك</strong> من قبل الإدارة بنجاح.</p>
                <p>يمكنك الآن تسجيل الدخول إلى التطبيق والاستفادة من كافة الخدمات مرة أخرى.</p>
                <p style='color: #6c757d; font-size: 12px; margin-top: 20px;'>شكراً لالتزامك بشروط الاستخدام الخاصة بنا.</p>
            </div>";

                returnMessage = "تم فك الحظر عن المستخدم بنجاح وإرسال إيميل للتأكيد.";
            }
            else

{
                //  حظر نهائي
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);

                if (tourguide != null)
                {
                    tourguide.SuspendForDebt();
                    _unitOfWork.TourGuides.Update(tourguide);

                    foreach (var booking in tourguide.Bookings)
                    {
                        booking.RejectBooking();
                        _unitOfWork.Bookings.Update(booking);
                    }
                    await _unitOfWork.CompleteAsync();
                }

                // تجهيز إيميل الحظر
                emailSubject = "تنبيه هام: تم إيقاف حسابك - Egypt Tours";
                emailBody = $@"
            <div style='text-align: right; font-family: Tahoma; direction: rtl; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                <h3 style='color: #dc3545;'>مرحباً {user.UserName}،</h3>
                <p>نأسف لإبلاغك بأنه قد تم <strong>إيقاف حسابك نهائياً</strong> من قبل إدارة المنصة لمخالفة شروط وأحكام الاستخدام.</p>
                <p>بناءً على هذا الإجراء، تم إلغاء ورفض جميع الحجوزات النشطة المرتبطة بحسابك تلقائياً.</p>
                <p style='color: #6c757d; font-size: 12px; margin-top: 20px;'>إذا كنت تعتقد أن هذا الإجراء تم بالخطأ، يرجى التواصل مع الدعم الفني.</p>
            </div>";

                returnMessage = "تم إيقاف حساب المستخدم بنجاح، ورفض جميع الحجوزات المتعلقة به، وإرسال إيميل بالحظر.";
            }

            //  4. السطر السحري لإرسال الإيميل لايف عبر Brevo
            try
            {
                await _emailService.SendEmailAsync(user.Email, emailSubject, emailBody);
            }
            catch (Exception ex)
            {
                // بنعمل Catch للإيرور عشان لو حصلت مشكلة في سيرفر الإيميل، عملية الحظر في الداتا بيز متوقفش
                Console.WriteLine($"فشل إرسال إيميل الحظر/فك الحظر: {ex.Message}");
            }

            return returnMessage;
        }

        public async Task<UserStatusDto> GetUserStatusAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return new UserStatusDto
                {
                    UserName = "المستخدم غير موجود",
                    Email = "",
                    Blocked = false    
                };

            bool Blocked = await _userManager.IsLockedOutAsync(user);

            return new UserStatusDto
            {
               
                UserName = user.UserName,
                Email = user.Email,
                Blocked = Blocked
            };
        }

        public async Task<IEnumerable<UserManagementDto>> GetAllUsersAsync()
        {
            // Batch-load users with their role assignments (no N+1)
            var users = await _userManager.Users.AsNoTracking().ToListAsync();
            if (users.Count == 0) return Enumerable.Empty<UserManagementDto>();

            var userIds = users.Select(u => u.Id).ToHashSet();

            // Single query: all user-role rows for these users joined to role names
            var roleRows = await (from ur in _context.UserRoles
                                  join r in _context.Roles on ur.RoleId equals r.Id
                                  where userIds.Contains(ur.UserId)
                                  select new { ur.UserId, RoleName = r.Name })
                                  .AsNoTracking()
                                  .ToListAsync();

            var rolesByUser = roleRows
                .GroupBy(x => x.UserId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName).ToList());

            var now = DateTimeOffset.UtcNow;
            return users.Select(user => new UserManagementDto
            {
                Id = user.Id,
                FullName = user.UserName,
                Email = user.Email,
                Role = (rolesByUser.TryGetValue(user.Id, out var r) ? r.FirstOrDefault() : null) ?? "No Role",
                Blocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > now
            }).ToList();
        }
        public async Task<string> DeleteUserPermanentlyAsync(string userId)
        {
            // 1. ندور على اليوزر
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new KeyNotFoundException("User not found.");



            // 2. أمر الحذف النهائي
            var result = await _userManager.DeleteAsync(user);



            if (result.Succeeded)
            {
                return "User and all related data deleted successfully.";
            }
            else
            {
                // لو حصل مشكلة (زي مشكلة العلاقات اللي شرحتهالك فوق) هيرجعلك السبب
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to delete user: {errors}");
            }
        }


        public async Task<AdminDashboardDto> GetDashboardStatsAsync()
        {

            var stats = new AdminDashboardDto();


            // هنجيب كل المستخدمين اللي نوعهم "سياح"
            var touristUsers = await _userManager.Users
                .Where(u => u.TouristProfile != null)
                .Include(u => u.TouristProfile)
                .AsNoTracking()
                .ToListAsync();



            // 1. أكثر 5 دول بييجي منها سياح
            stats.TopTouristCountries = touristUsers
             .GroupBy(u => u.Country)
             .Select(g => new CountryStatDto { CountryName = g.Key, Count = g.Count() })
             .OrderByDescending(c => c.Count)
             .Take(5)
             .ToList();



            // 2. توزيع الأعمار (عشان تترسم كـ Bar Chart أو Pie Chart)
            stats.TouristAgeDistribution = new AgeDistributionDto
            {
                Youth = touristUsers.Count(u => u.Age >= 18 && u.Age <= 25),
                Adults = touristUsers.Count(u => u.Age >= 26 && u.Age <= 40),
                MiddleAged = touristUsers.Count(u => u.Age >= 41 && u.Age <= 55),
                Seniors = touristUsers.Count(u => u.Age > 55)
            };



            // 3. نسبة الذكور والإناث
            stats.GenderDistribution = touristUsers
             .GroupBy(u => u.Gender)
             .Select(g => new GenderStatDto { Gender = g.Key.ToString(), Count = g.Count() })
             .ToList();



            // 4. أكثر اللغات طلباً (من بيانات السياح)
            stats.TopRequestedLanguages = touristUsers
             .Where(u => u.TouristProfile != null)
             .GroupBy(u => u.TouristProfile.Language)
             .Select(g => new LanguageStatDto { Language = g.Key, Count = g.Count() })
             .OrderByDescending(l => l.Count)
             .Take(5)
             .ToList();
            // 1. حساب الأرقام الأساسية (KPIs)
            stats.TotalTourists = await _unitOfWork.Tourists.CountAsync(t => true);
            stats.TotalGuides = await _unitOfWork.TourGuides.CountAsync(g => g.State == true);
            stats.PendingGuides = await _unitOfWork.TourGuides.CountAsync(g => g.State == false);

            var completedBookings = await _unitOfWork.Bookings.FindAsync(b => b.State == "Completed");
            stats.TotalCompletedBookings = completedBookings.Count();
            stats.TotalSystemRevenue = completedBookings.Sum(b => b.CommissionAmount);
            completedBookings = null; // release memory early



            var guidesWithDebt = await _unitOfWork.TourGuides.GetAllAsyncInclude(g => g.Include(g => g.Bookings).Include(g=>g.User));
            stats.TotalOutstandingDebts = guidesWithDebt.Sum(g => g.OutstandingBalance);



            // 2. توزيع حالات الحجوزات (للرسم البياني الدائري)
            var allBookings = await _unitOfWork.Bookings.GetAllAsync();
            stats.BookingStatusDistribution = allBookings
            .GroupBy(b => b.State)
            .Select(g => new StatusDistributionDto
            {
                StatusName = g.Key,
                Count = g.Count()
            }).ToList();



            // 3. الأداء الشهري لآخر 12 شهر (للرسم البياني الخطي)
            var startDate = DateTime.UtcNow.AddMonths(-11);
            stats.MonthlyPerformance = allBookings
            .Where(b => b.CreatedAt >= startDate)
            .GroupBy(b => new { b.CreatedAt.Year, b.CreatedAt.Month })
            .Select(g => new MonthlyStatsDto
            {
                MonthName = $"{new DateTime(g.Key.Year, g.Key.Month, 1):MMM yyyy}",
                BookingsCount = g.Count(),
                Commission = g.Where(x => x.State == "Completed").Sum(x => x.CommissionAmount)
            })
            .OrderBy(x => DateTime.Parse(x.MonthName))
            .ToList();



            // 4. أفضل 5 مرشدين (Top 5 Guides)
            stats.TopRatedGuides = guidesWithDebt
         .OrderByDescending(g => g.Rate)
         .Take(5)
         .Select(g => new TopGuideDto
         {
             Name = g.User?.UserName ?? "Unknown",
             Rate = g.Rate,
             Earnings = g.Bookings.Where(b => b.State == "Completed").Sum(b => b.CommissionAmount)
         }).ToList();



            return stats;
        }


    }
}
