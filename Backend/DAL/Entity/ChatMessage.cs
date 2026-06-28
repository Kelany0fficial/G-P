
namespace DAL.Entity
{
    public class ChatMessage
    {
        public Guid Id { get; private set; }



        // الشات مربوط بحجز معين
        [Required]
        [ForeignKey("Booking")]
        public Guid BookingId { get; private set; }
        public virtual Booking Booking { get; private set; }



        // مين اللي بعت الرسالة؟ (ممكن يكون ID السائح أو ID المرشد)
        [Required]
        public string SenderId { get; private set; }



        // مين اللي هيستقبل الرسالة؟
        [Required]
        public string ReceiverId { get; private set; }



        [Required]
        [MaxLength(2000)]
        public string Content { get; private set; }



        public DateTime SentAt { get; private set; } = DateTime.UtcNow;



        // هل الرسالة اتقرأت ولا لسه؟ (ممكن تنفعنا بعدين في الـ UI)
        public bool IsRead { get; private set; } = false;



        protected ChatMessage() { }



        public ChatMessage(Guid bookingId, string senderId, string receiverId, string content)
        {
            Id = Guid.NewGuid();
            BookingId = bookingId;
            SenderId = senderId;
            ReceiverId = receiverId;
            Content = content;
        }



        // لو عايزين نحدث حالة الرسالة إنها اتقرأت
        public void MarkAsRead()
        {
            IsRead = true;
        }
    }
}
