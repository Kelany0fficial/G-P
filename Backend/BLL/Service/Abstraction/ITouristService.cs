using BLL.ModelVm.TouristVm;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface ITouristService
    {
        Task<TouristProfileDto> GetMyProfileAsync(string touristId);
        Task<bool> UpdateProfileAsync(string touristId, UpdateTouristProfileDto dto);
        Task<string> UpdateProfileImageAsync(string touristId, IFormFile profileImage);
       
    }
}
