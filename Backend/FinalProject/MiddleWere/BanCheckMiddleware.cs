namespace FinalProject.MiddleWere
{
    public class BanCheckMiddleware
    {
        private readonly RequestDelegate _next;



        public BanCheckMiddleware(RequestDelegate next)
        {
            _next = next;
        }



        // 🚨 بنحقن الـ UserManager هنا في الـ InvokeAsync عشان هو Scoped
        public async Task InvokeAsync(HttpContext context, UserManager<AppUser> userManager)
        {
            // 1. هل اليوزر معاه توكن ومسجل دخول؟
            if (context.User.Identity != null && context.User.Identity.IsAuthenticated)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (!string.IsNullOrEmpty(userId))
                {
                    // 2. نجيب اليوزر من الداتا بيز
                    var user = await userManager.FindByIdAsync(userId);



                    // 3. لو اليوزر اتمسح خالص، أو معموله Lockout (حظر) في اللحظة دي
                    if (user == null || (user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow))
                    {
                        // 4. اطرد اليوزر فوراً ورجع إيرور 403 (Forbidden)
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";

                        await context.Response.WriteAsJsonAsync(new
                        {
                            IsSuccess = false,
                            Message = "عفواً، تم إيقاف حسابك من قبل الإدارة ولن تتمكن من تنفيذ أي عملية."
                        });

                        return; // 🚨 بنوقف الريكويست هنا ومش بنخليه يكمل للكنترولر
                    }
                }
            }



            // لو اليوزر سليم ومش محظور، سيبه يكمل طريقه عادي
            await _next(context);
        }
    }
}
