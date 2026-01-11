using BE.Data; // Thay bằng namespace thực tế của bạn
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer; // Cần cho JWT
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using BE.Models;
using Microsoft.AspNetCore.Identity;
using BE.Services; // Cần dòng này để cấu hình Swagger

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình DB Context (Giữ nguyên của bạn)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
    // Cấu hình password cho đơn giản (tùy chọn)
    options.Password.RequireDigit = false; 
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// 2. Cấu hình Authentication (Như đã sửa ở bước trước)
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        // Lấy key từ appsettings.json
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]))
    };
});

builder.Services.AddControllers();

// ==================================================================
// PHẦN CẤU HÌNH SWAGGER (THÊM ĐOẠN NÀY)
// ==================================================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Hackathon API", Version = "v1" });

    // Cấu hình để Swagger hiện nút "Authorize" (ổ khóa) cho JWT
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token vào đây (không cần từ 'Bearer' ở đầu, chỉ cần paste token)."
    });

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
// ==================================================================

builder.Services.AddScoped<IBlockchainService, BlockchainService>();

var app = builder.Build();

// ==================================================================
// KÍCH HOẠT SWAGGER UI (THÊM ĐOẠN NÀY)
// ==================================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // Truy cập tại /swagger/index.html
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseAuthentication(); // Nhớ đặt Auth trước Authorization
app.UseAuthorization();

app.MapControllers();

app.Run();