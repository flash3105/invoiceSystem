using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using InvoiceSystem.Services;
using InvoiceSystem.Helpers;
using Microsoft.OpenApi.Models;
using dotenv.net;
using QuestPDF.Infrastructure;

// Load .env file
DotEnv.Load(options: new DotEnvOptions(envFilePaths: new[] { ".env" }));

var builder = WebApplication.CreateBuilder(args);

// Register QuestPDF license (MUST be before any PDF generation)
QuestPDF.Settings.License = LicenseType.Community;

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your token"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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
            Array.Empty<string>()
        }
    });
});

// Register services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ClientService>();
builder.Services.AddScoped<BusinessProfileService>();
builder.Services.AddScoped<InvoiceService>();
builder.Services.AddScoped<InvoicePdfService>(); 
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<InvoiceEmailService>();

builder.Services.AddHttpClient<EmailService>();

// ========== CORS Configuration from .env ==========
var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?
    .Split(',', StringSplitOptions.RemoveEmptyEntries)
    .Select(o => o.Trim())
    .ToArray() ?? new[] { 
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://hsholdings.co.za"
    };

Console.WriteLine($"CORS Allowed Origins: {string.Join(", ", allowedOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
});

// JWT Authentication - Get from environment variable
var secretKey = Environment.GetEnvironmentVariable("SUPABASE_JWT_SECRET") 
    ?? throw new Exception("SUPABASE_JWT_SECRET environment variable not configured");

var key = Encoding.UTF8.GetBytes(secretKey);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "InvoiceSystem",
            ValidateAudience = true,
            ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "InvoiceSystemClient",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ========== CORS Middleware - MUST BE BEFORE AUTHENTICATION ==========
app.UseCors("AllowSpecificOrigins");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();