using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    

    namespace Athar.Data
    {
        public static class SeedData
        {
            public static async Task InitializeAsync(IServiceProvider serviceProvider)
            {
                var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();

                // 1. زراعة الصلاحيات (Roles)
                string[] roles = { "Admin", "Tourist", "Guide" };
                foreach (var role in roles)
                {
                    if (!await roleManager.RoleExistsAsync(role))
                    {
                        await roleManager.CreateAsync(new IdentityRole(role));
                    }
                }

                // 2. إنشاء حساب الـ Admin الافتراضي
                var adminEmail = "admin@athar.com";
                var adminUser = await userManager.FindByEmailAsync(adminEmail);

                if (adminUser == null)
                {
                    // استخدمنا الـ Constructor اللي بيطلب (الاسم، الإيميل، السن، البلد)
                    var newAdmin = new AppUser("AtharAdmin",adminEmail,22,"Egypt",Enum.EnumGender.Male,null);

                    // إنشاء الحساب بباسورد قوي
                    var createResult = await userManager.CreateAsync(newAdmin, "Admin@123!");

                    if (createResult.Succeeded)
                    {
                        // إعطاء صلاحية الأدمن للحساب
                        await userManager.AddToRoleAsync(newAdmin, "Admin");
                    }
                }
            }
        }
    }
}
