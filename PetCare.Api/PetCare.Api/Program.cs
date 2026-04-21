using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using PetCare.Api.Data;
using PetCare.Api.Model;
using PetCare.Api.Security;
using PetCare.Api.Services.Email;
using System.Text;
using System.Text.Json.Serialization;

const string AdminUiCorsPolicy = "AdminUiCors";
const string AdminUiRoutePrefix = "/admin";

var builder = WebApplication.CreateBuilder(args);

// Build a mapped Npgsql data source so C# enum <-> PG enum works
var cs = builder.Configuration.GetConnectionString("Postgres");
var dsb = new NpgsqlDataSourceBuilder(cs);
dsb.MapEnum<PetSex>(pgName: "pet_sex"); // map enum type name in PostgreSQL
var dataSource = dsb.Build();

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(dataSource)
);
builder.Services.Configure<EmailSenderOptions>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

// Controllers + Swagger (+ JSON enum converter + JWT scheme)
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PetCare API", Version = "v1" });
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT}"
    };
    c.AddSecurityDefinition("Bearer", jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(AdminUiCorsPolicy, policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.Equals(origin, "null", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return false;
                }

                return uri.Host is "localhost" or "127.0.0.1" or "::1";
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var secret = builder.Configuration["Jwt:Secret"] ?? "dev_secret_change_me_very_long";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new()
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthConstants.Policies.UserOnly, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new UserAccessRequirement());
    });

    options.AddPolicy(AuthConstants.Policies.AdminOnly, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new AdminAccessRequirement(AdminRole.Admin, AdminRole.Manager));
    });

    options.AddPolicy(AuthConstants.Policies.ManagerOnly, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new AdminAccessRequirement(AdminRole.Manager));
    });
});

builder.Services.AddScoped<IAuthorizationHandler, UserAccessHandler>();
builder.Services.AddScoped<IAuthorizationHandler, AdminAccessHandler>();

var app = builder.Build();
var adminUiPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "pets-app-admin"));
var hasAdminUi = Directory.Exists(adminUiPath);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(AdminUiCorsPolicy);
app.UseHttpsRedirection();

if (hasAdminUi)
{
    var adminUiProvider = new PhysicalFileProvider(adminUiPath);
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = adminUiProvider,
        RequestPath = AdminUiRoutePrefix,
        DefaultFileNames = { "index.html" }
    });

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = adminUiProvider,
        RequestPath = AdminUiRoutePrefix,
        ContentTypeProvider = new FileExtensionContentTypeProvider()
    });
}

app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var bootstrapEmail = cfg["AdminBootstrap:Email"]?.Trim();
    var bootstrapPassword = cfg["AdminBootstrap:Password"];
    if (!string.IsNullOrWhiteSpace(bootstrapEmail) && !string.IsNullOrWhiteSpace(bootstrapPassword))
    {
        var normalizedEmail = bootstrapEmail.ToLowerInvariant();
        var existingManager = await db.AdminUsers.FirstOrDefaultAsync(a => a.Email == normalizedEmail);
        if (existingManager is null)
        {
            var username = cfg["AdminBootstrap:Username"]?.Trim();
            var firstName = cfg["AdminBootstrap:FirstName"]?.Trim();
            var lastName = cfg["AdminBootstrap:LastName"]?.Trim();
            var now = DateTimeOffset.UtcNow;

            db.AdminUsers.Add(new AdminUser
            {
                Username = string.IsNullOrWhiteSpace(username) ? "manager" : username,
                FirstName = string.IsNullOrWhiteSpace(firstName) ? "System" : firstName,
                LastName = string.IsNullOrWhiteSpace(lastName) ? "Manager" : lastName,
                Email = normalizedEmail,
                PasswordHash = PasswordHasher.Hash(bootstrapPassword),
                Role = AdminRole.Manager,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            });

            await db.SaveChangesAsync();
        }
    }
}

app.Run();
