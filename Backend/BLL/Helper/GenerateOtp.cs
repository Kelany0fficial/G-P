using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Helper
{
    public static class GenerateOtp
    {
        public static string GenerateOtpFor()
        {
            return RandomNumberGenerator
                .GetInt32(100000, 999999)
                .ToString();
        }

    }
}
