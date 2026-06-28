using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Admin
{
    public class UserStatusDto
    {
        public string UserName { get; set; }
        public string Email { get; set; }
        public bool Blocked { get; set; }
    }
}
