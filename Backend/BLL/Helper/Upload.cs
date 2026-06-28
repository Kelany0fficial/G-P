using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Helper
{
    public class Upload
    {
        // Method to Upload File
        public static string UploadFile(string FolderName, IFormFile File)
        {
            try
            {
                // 1) Get Directory Path
                string FolderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/Files/", FolderName);

                // 2) Get File Name (Using Guid to ensure uniqueness)
                string FileName = Guid.NewGuid() + Path.GetFileName(File.FileName);

                // 3) Merge Path with File Name
                string FinalPath = Path.Combine(FolderPath, FileName);

                // 4) Save File As Streams
                using (var Stream = new FileStream(FinalPath, FileMode.Create))
                {
                    File.CopyTo(Stream);
                }

                return FileName; // Return the name to save it in Database
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        // Method to Remove File
        public static string RemoveFile(string FolderName, string fileName)
        {
            try
            {
                var directory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/Files", FolderName, fileName);

                if (File.Exists(directory))
                {
                    File.Delete(directory);
                    return "File Deleted";
                }

                return "File Not Deleted";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }
    }
}