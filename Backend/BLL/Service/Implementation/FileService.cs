using BLL.Service.Abstraction;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Service.Implementation
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _env;



        public FileService(IWebHostEnvironment env)
        {
            _env = env;
        }



        private static readonly long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
        private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/quicktime", "video/webm"
        };

        public async Task<string> UploadFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("الملف غير صالح أو فارغ");

            if (file.Length > MaxFileSizeBytes)
                throw new ArgumentException("حجم الملف يتجاوز الحد المسموح به (10 ميجابايت).");

            if (!AllowedMimeTypes.Contains(file.ContentType))
                throw new ArgumentException("نوع الملف غير مسموح به. يُسمح فقط بالصور ومقاطع الفيديو.");



            // 1. تحديد مسار الفولدر جوه wwwroot (مثلاً: wwwroot/images/profiles)
            var folderPath = Path.Combine(_env.WebRootPath, folderName);



            // لو الفولدر مش موجود، السيرفر هيكريته أوتوماتيك
            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);



            // 2. عمل اسم مميز جداً للملف عشان نمنع التكرار (بنستخدم Guid)
            // مثال: 5a7b8-profile.jpg
            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(folderPath, fileName);



            // 3. حفظ الملف الفعلي في السيرفر
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }



            // 4. ترجيع المسار النسبي عشان يتحفظ في الداتا بيز ويقرأه الويب سايت
            return $"/{folderName}/{fileName}";
        }



        public void DeleteFile(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl)) return;



            // تحويل الرابط لمسار حقيقي على السيرفر ومسح الملف
            var filePath = Path.Combine(_env.WebRootPath, fileUrl.TrimStart('/'));
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
    }
}
