using BLL.ModelVm.Chat;
using DAL.Entity;
namespace BLL.Service.Implementation
{
    public class ChatService : IChatService
    {
        private readonly IUnitOfWork _unitOfWork;



        public ChatService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }



        public async Task<IEnumerable<ChatMessageDto>> GetChatHistoryAsync(Guid bookingId, string currentUserId)
        {
            var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
            if (booking == null) throw new Exception("الحجز غير موجود.");



            // التأكد إن اليوزر ده طرف في المحادثة
            if (booking.TouristId != currentUserId && booking.GuideId != currentUserId)
                throw new Exception("غير مصرح لك برؤية هذه المحادثة.");



            // جلب الرسايل المرتبطة بالحجز ده وترتيبها من الأقدم للأحدث (عشان الشات يظهر صح)
            var messages = await _unitOfWork.ChatMessages.FindAsync(m => m.BookingId == bookingId);



            return messages.OrderBy(m => m.SentAt).Select(m => new ChatMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                ReceiverId = m.ReceiverId,
                Content = m.Content,
                SentAt = m.SentAt,
                IsMine = m.SenderId == currentUserId // لو أنا اللي باعت تبقى true
            }).ToList();
        }



        public async Task<ChatMessageDto> SaveMessageAsync(Guid bookingId, string senderId, string content)
        {
            var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
            if (booking == null) throw new Exception("الحجز غير موجود.");



            // 🚨 أهم شرط: الشات مش هيتفتح إلا لو الحجز Accepted
            if (booking.State != "Accepted")
                throw new Exception("لا يمكن بدء المحادثة إلا بعد قبول الحجز.");



            // التأكد إن المرسل طرف في الحجز، وتحديد مين المستقبل
            string receiverId =string.Empty;
            if (senderId == booking.TouristId)
            {
                receiverId = booking.GuideId; // لو السائح اللي بيبعت، يبقى المرشد هو اللي هيستقبل
            }
            else if (senderId == booking.GuideId)
            {
                receiverId = booking.TouristId; // لو المرشد اللي بيبعت، يبقى السائح هو اللي هيستقبل
            }
            else
            {
                throw new Exception("غير مصرح لك بإرسال رسائل في هذا الحجز.");
            }



            // إنشاء الرسالة وحفظها
            var message = new ChatMessage(bookingId, senderId, receiverId, content);
            await _unitOfWork.ChatMessages.AddAsync(message);
            await _unitOfWork.CompleteAsync();



            // إرجاع DTO عشان نبعته للفرونت إند (هينفعنا جداً في الـ SignalR)
            return new ChatMessageDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                ReceiverId = message.ReceiverId,
                Content = message.Content,
                SentAt = message.SentAt,
                IsMine = true // دايماً المرسل هيشوف رسالته IsMine = true
            };
        }
    }
}
