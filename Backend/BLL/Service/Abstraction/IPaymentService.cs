using BLL.ModelVm.Payment;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IPaymentService
    {
        Task<(bool IsSuccess, string Message, decimal NewOutstandingBalance, decimal NewWalletBalance)> PayGuideDuesAsync(string guideId, ProcessPaymentDto dto);
    }
}
