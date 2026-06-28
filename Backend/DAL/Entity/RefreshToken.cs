using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    
        public class RefreshToken
        {
            public int Id { get; set; }

            public string Token { get; set; }

            public DateTime ExpireAt { get; set; }

            public bool IsRevoked { get; set; }

            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

            public string UserId { get; set; }

            public virtual AppUser User { get; set; }
        }
    }

