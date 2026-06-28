using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class DebtMonitorWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public DebtMonitorWorker(IServiceProvider serviceProvider)
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
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                    var limitDate = DateTime.UtcNow.AddDays(-30);

                    var overdueGuides = await unitOfWork.TourGuides.FindAsyncInclude(
                        g => g.State == true && g.OutstandingBalance > 0 && g.DebtStartDate != null && g.DebtStartDate <= limitDate,
                        g => g.User
                    );

                    foreach (var guide in overdueGuides)
                    {
                        guide.SuspendForDebt();
                        unitOfWork.TourGuides.Update(guide);

                        string subject = "إيقاف مؤقت للحساب بسبب تأخر السداد";
                        string body = $@"
<h3 style='color:red;'>مرحباً {guide.User?.UserName ?? "يا كابتن"}،</h3>
<p>تم <b>إيقاف حسابك مؤقتاً</b> نظراً لعدم سداد مديونيتك البالغة <b>{guide.OutstandingBalance}</b> لمدة تتجاوز 30 يوماً.</p>
<p>يرجى سداد المديونية ليتم تفعيل حسابك تلقائياً والعودة لاستقبال الحجوزات.</p>";

                        if (!string.IsNullOrEmpty(guide.User?.Email))
                        {
                            try
                            {
                                await emailService.SendEmailAsync(guide.User.Email, subject, body);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine(ex.Message);
                            }
                        }
                    }

                    // Single save for all suspended guides
                    if (overdueGuides.Any())
                    {
                        await unitOfWork.CompleteAsync();
                    }
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
