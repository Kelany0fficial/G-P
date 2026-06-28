using DAL.Errors;
using System.Net;
using System.Text.Json;

namespace FinalProject.MiddleWere
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;



        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next; // دي الدالة اللي بتنقل الطلب للمرحلة اللي بعدها
            _logger = logger; // عشان نطبع الإيرور في الكونسول
            _env = env; // عشان نعرف إحنا في مرحلة التطوير (Development) ولا الإنتاج (Production)
        }



        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // حاول تمرر الطلب للـ Controller عادي جداً
                await _next(context);
            }
            catch (Exception ex)
            {
                // لو حصل أي إيرور في أي مكان في السيستم، هيمسكه هنا
                _logger.LogError(ex, ex.Message);



                // تجهيز الرد عشان يكون JSON
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;



                // لو إحنا في Development بنبعت تفاصيل الإيرور، لو Production بنخفيها لدواعي أمنية
                var response = _env.IsDevelopment()
 ? new ApiException(context.Response.StatusCode, ex.InnerException?.Message ?? ex.Message, ex.StackTrace?.ToString())
 : new ApiException(context.Response.StatusCode, "Internal Server Error");



                // تحويل الكلاس لـ JSON بحروف صغيرة (CamelCase) عشان الويب سايت يفهمه
                var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                var json = JsonSerializer.Serialize(response, options);



                // إرسال الرد للويب سايت
                await context.Response.WriteAsync(json);
            }
        }
    }
}
