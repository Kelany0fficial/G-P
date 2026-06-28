using BLL.ModelVm.Payment;
using DAL.Entity;
using System;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;

        public PaymentService(IUnitOfWork unitOfWork, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
        }

        public async Task<(bool IsSuccess, string Message, decimal NewOutstandingBalance, decimal NewWalletBalance)>
            PayGuideDuesAsync(string guideId, ProcessPaymentDto dto)
        {
            if (dto == null || dto.Amount <= 0)
                return (false, "Amount must be greater than zero.", 0, 0);

            var guide = await _unitOfWork.TourGuides.GetByIdWithIncludesAsync(
                g => g.GuideId == guideId,
                g => g.User);

            if (guide == null)
                return (false, "Guide profile not found.", 0, 0);

            try
            {
                decimal outstandingBefore = guide.OutstandingBalance;
                // Entity logic already routes any over-payment into the wallet (top-up allowed).
                guide.PayDues(dto.Amount);

                // Auto-reactivate when debt is cleared and the only reason for suspension was financial.
                if (guide.OutstandingBalance == 0 && guide.State == false && guide.IsSuspended)
                {
                    guide.ActivateGuide();
                }

                var paymentRecord = new Payment(
                    guideId,
                    dto.Amount,
                    guide.OutstandingBalance,
                    dto.PayMethod);

                await _unitOfWork.Payments.AddAsync(paymentRecord);
                _unitOfWork.TourGuides.Update(guide);
                await _unitOfWork.CompleteAsync();

                string headline;
                if (outstandingBefore == 0)
                {
                    headline = $"Wallet top-up of {dto.Amount:N2} received. Wallet balance is now {guide.WalletBalance:N2}.";
                }
                else if (guide.OutstandingBalance == 0)
                {
                    headline = guide.WalletBalance > 0
                        ? $"Debt cleared. Surplus of {guide.WalletBalance:N2} credited to your wallet."
                        : "Debt cleared in full.";
                }
                else
                {
                    headline = $"Payment received. Remaining debt: {guide.OutstandingBalance:N2}.";
                }

                if (!string.IsNullOrWhiteSpace(guide.User?.Email))
                {
                    string subject = "Ather — Payment confirmation";
                    string body = $@"
<div style='font-family:Inter,Segoe UI,Tahoma,sans-serif'>
  <h3>Hi {guide.User?.UserName ?? "captain"},</h3>
  <p>We received your payment of <b>{dto.Amount:N2}</b>.</p>
  <ul>
    <li>Outstanding debt: <b>{guide.OutstandingBalance:N2}</b></li>
    <li>Wallet balance: <b>{guide.WalletBalance:N2}</b></li>
  </ul>
  <p>{headline}</p>
</div>";
                    try { await _emailService.SendEmailAsync(guide.User!.Email!, subject, body); }
                    catch { /* email failure must not roll back the payment */ }
                }

                return (true, headline, guide.OutstandingBalance, guide.WalletBalance);
            }
            catch (ArgumentException ex)
            {
                return (false, ex.Message, guide.OutstandingBalance, guide.WalletBalance);
            }
            catch (Exception ex)
            {
                return (false, ex.Message, guide.OutstandingBalance, guide.WalletBalance);
            }
        }
    }
}
