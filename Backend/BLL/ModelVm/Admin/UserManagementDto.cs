using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Admin
{
    public class UserManagementDto
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; } // سائح أو مرشد
        public bool Blocked { get; set; } // القيمة دي هي اللي الفرونت إند هيبني عليها
        public string? ProfilePicture { get; set; }
     
    }
}
