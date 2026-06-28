using BLL.Hubs;
using FinalProject.MiddleWere;
using Microsoft.OpenApi.Models;

namespace FinalProject
{
    public  class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddHttpClient();
            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
            builder.Services.AddScoped<IFileService, BLL.Service.Implementation.FileService>();
            builder.Services.AddScoped<IPlaceService, BLL.Service.Implementation.PlaceService>();
            builder.Services.AddScoped<IBookingService, BLL.Service.Implementation.BookingService>();
            builder.Services.AddScoped<ITouristService, BLL.Service.Implementation.TouristService>();
            builder.Services.AddScoped<IPaymentService, BLL.Service.Implementation.PaymentService>();
            builder.Services.AddScoped<IReviewService, BLL.Service.Implementation.ReviewService>();
            builder.Services.AddScoped<IChatService, BLL.Service.Implementation.ChatService>();
            builder.Services.AddScoped<IStoryService, BLL.Service.Implementation.StoryService>();
            builder.Services.AddScoped<IAdminService, BLL.Service.Implementation.AdminService>();
            builder.Services.AddScoped<IEmailService, BLL.Service.Implementation.EmailService>();
            builder.Services.AddScoped<IAIRecommendation, AIRecommendation>();
            builder.Services.AddScoped<IInteractionService, BLL.Service.Implementation.InteractionService>();
            builder.Services.AddScoped<IExternalPlaceApiService, BLL.Service.Implementation.MockExternalPlaceApiService>();
            builder.Services.AddScoped<IAppNotificationService, BLL.Service.Implementation.AppNotificationService>();
            builder.Services.AddScoped<IAiIntegrationModelChat, BLL.Service.Implementation.AiIntegrationModelChat>();
            // تسجيل الـ Background Service
            builder.Services.AddHostedService<BookingUpdateWorker>();
            // تسجيل خدمة متابعة المديونيات في الخلفية
            builder.Services.AddHostedService<BLL.Service.Implementation.DebtMonitorWorker>();
            // تسجيل خدمة المرشدين
            builder.Services.AddScoped<IGuideService, BLL.Service.Implementation.GuideService>();
            // تسجيل الـ HttpClient عشان نقدر نكلم سيرفرات تانية
            builder.Services.AddHttpClient<IAiIntegrationService, BLL.Service.Implementation.AiIntegrationService>();
            builder.Services.AddSignalR();








            builder.Services.AddMemoryCache(); // لتفعيل الكاشنج
            /*builder.Services.AddHttpClient<IPlaceService, BLL.Service.Implementation.PlaceService>(); */// لتسجيل الخدمة مع HttpClient

            // تسجيل الـ PlanService
            builder.Services.AddScoped<IPlanService, BLL.Service.Implementation.PlanService>();
            
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "Ather API", Version = "v1" });

                // 1. تعريف نظام التوثيق (JWT)
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "دخل الـ Token بتاعك هنا بس: (بدون كلمة Bearer قبلها)"
                });

                // 2. تفعيل نظام التوثيق في العمليات
                options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
            });
            builder.Services.AddDbContext<AppDbContext>(options =>
         options.UseSqlServer(builder.Configuration.GetConnectionString("conString")));
            builder.Services.AddIdentity<AppUser, IdentityRole>()
               .AddEntityFrameworkStores<AppDbContext>().AddDefaultTokenProviders();
            builder.Services.AddHangfire(x => x.UseSqlServerStorage(builder.Configuration.GetConnectionString("conString")));
            builder.Services.AddHangfireServer();





            builder.Services.AddAuthorization();
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
  .AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],

        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:ValidAudience"],

        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"]))
    };

    // ... إعدادات الـ TokenValidationParameters القديمة زي ما هي، متمسحهاش!



    // 🚨 ضيف الجزء ده عشان SignalR يقدر يقرأ التوكن من الـ URL
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;



            // 🚨 التعديل هنا: استخدمنا OrdinalIgnoreCase عشان يتجاهل الحروف الكبيرة والصغيرة
            // وكمان ضفنا الشات هاب عشان يشتغل معاك بعدين
            if (!string.IsNullOrEmpty(accessToken) &&
(path.StartsWithSegments("/notificationhub", StringComparison.OrdinalIgnoreCase) ||
path.StartsWithSegments("/chathub", StringComparison.OrdinalIgnoreCase)))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});







            builder.Services.AddControllers()
.ConfigureApiBehaviorOptions(options =>
{
options.SuppressModelStateInvalidFilter = true;
});


            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .SetIsOriginAllowed(_ => true)
                        .AllowCredentials();
                });
            });

            var app = builder.Build();

            // تفعيل الـ Middleware الخاص بنا
            app.UseMiddleware<FinalProject.MiddleWere.ExceptionMiddleware>();


            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    // Apply any pending EF Core migrations automatically on startup.
                    // This includes AutoSetIdFromModel which sets IdFromModel on
                    // all Places that still have the default value of 0.
                    var db = services.GetRequiredService<AppDbContext>();
                    await db.Database.MigrateAsync();

                    // استدعاء الميثود اللي جهزناها في الخطوة الأولى
                    await SeedData.InitializeAsync(services);
                }
                catch (Exception ex)
                {
                    // لو حصلت مشكلة في الداتا بيز تظهر في الكونسول
                    Console.WriteLine($"حدث خطأ أثناء زراعة البيانات: {ex.Message}");
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            //app.UseHttpsRedirection();

            app.UseStaticFiles();

            app.UseRouting();

            app.UseCors("AllowAll");

            app.UseAuthentication();
            // 🚨 2. العسكري بتاعنا بيفتش على الحظر هنا
            app.UseMiddleware<BanCheckMiddleware>();

            app.UseAuthorization();
            app.MapControllers();
            app.MapHub<ChatHub>("/chathub");// ده اللينك اللي الفرونت إند هيكلمك علي
            app.MapHub<NotificationHub>("/notificationhub");// ده اللينك اللي الفرونت إند هيكلمك علي
            app.UseHangfireDashboard("/Ahmed", new DashboardOptions
            {
                Authorization = new[] { new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter() }
            });
            app.Run();
        }
    }

}
