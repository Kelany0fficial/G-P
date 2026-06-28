using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Chat
{
    public class ChatMessageDto
    {
        public Guid Id { get; set; }
        public string SenderId { get; set; }
        public string ReceiverId { get; set; }
        public string Content { get; set; }
        public DateTime SentAt { get; set; }

        // الحقل ده سحري للفرونت إند: لو true يعرض الرسالة بلون مختلف (رسالتي)
        public bool IsMine { get; set; }
    }
}
