using BLL.ModelVm.Chat;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IChatService
    {
        // جلب تاريخ المحادثة لرحلة معينة
        Task<IEnumerable<ChatMessageDto>> GetChatHistoryAsync(Guid bookingId, string currentUserId);

        // حفظ رسالة جديدة في الداتا بيز
        Task<ChatMessageDto> SaveMessageAsync(Guid bookingId, string senderId, string content);
    }
}
