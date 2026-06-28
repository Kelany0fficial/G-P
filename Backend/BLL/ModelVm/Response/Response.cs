using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.ModelVm.Response
{
    public record Response<T>(
        T? Data ,
        bool IsSuccess,
        string Message,
        string? Token 
    );


}
