using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Abstraction
{
    public interface IFileService
    {

      

        // دالة لرفع الصورة (بتاخد الملف واسم الفولدر اللي هتتحفظ فيه)
        Task<string> UploadFileAsync(IFormFile file, string folderName);

        // دالة لمسح الصورة (لو اليوزر مسح الاستوري مثلاً)
        void DeleteFile(string fileUrl);
    }
}
