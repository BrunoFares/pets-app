using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using PetCare.Api.Data;
using PetCare.Api.Model;
using PetCare.Api.Security;
using PetCare.Api.Services;
using PetCare.Api.Services.Email;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

const string AdminUiCorsPolicy = "AdminUiCors";
const string AdminUiRoutePrefix = "/admin";
const string AdminUiLoginPath = "/admin/login";
const string AuthRateLimitPolicy = "auth";
const string UploadRateLimitPolicy = "uploads";

var builder = WebApplication.CreateBuilder(args);
var usingDevelopmentJwtSecretFallback = false;

// Build a mapped Npgsql data source so C# enum <-> PG enum works
var cs = builder.Configuration.GetConnectionString("Postgres");
if (string.IsNullOrWhiteSpace(cs))
{
    throw new InvalidOperationException("Missing ConnectionStrings:Postgres configuration.");
}

var dsb = new NpgsqlDataSourceBuilder(cs);
dsb.MapEnum<PetSex>(pgName: "pet_sex"); // map enum type name in PostgreSQL
var dataSource = dsb.Build();

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(dataSource)
);
builder.Services.AddScoped<AdminAuditLogger>();
builder.Services.Configure<PetTranslatorOptions>(builder.Configuration.GetSection("PetTranslator"));
builder.Services.Configure<EmailSenderOptions>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<PetTranslatorService>();
builder.Services.AddProblemDetails();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        var httpContext = context.HttpContext;
        httpContext.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too many requests.",
            Detail = "Please wait a moment before retrying this request.",
            Instance = httpContext.Request.Path
        };
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            problem.Extensions["retryAfterSeconds"] = (int)Math.Ceiling(retryAfter.TotalSeconds);
        }

        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken: cancellationToken);
    };

    options.AddPolicy(AuthRateLimitPolicy, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetRateLimitPartitionKey(httpContext, "auth"),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 6,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy(UploadRateLimitPolicy, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetRateLimitPartitionKey(httpContext, "upload"),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

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
                if (builder.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(origin))
                {
                    return true;
                }

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

var secret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(secret))
{
    if (builder.Environment.IsDevelopment())
    {
        secret = "dev_secret_change_me_very_long";
        usingDevelopmentJwtSecretFallback = true;
    }
    else
    {
        throw new InvalidOperationException("Missing Jwt:Secret configuration.");
    }
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException("Missing Jwt:Issuer configuration.");
}

var jwtAudience = builder.Configuration["Jwt:Audience"];
if (string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException("Missing Jwt:Audience configuration.");
}

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
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrWhiteSpace(context.Token) &&
                    context.Request.Cookies.TryGetValue(AuthConstants.Cookies.AdminAccessToken, out var cookieToken))
                {
                    context.Token = cookieToken;
                }

                return Task.CompletedTask;
            }
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

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5063);
});

var app = builder.Build();
var adminUiPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "pets-app-admin"));
var hasAdminUi = Directory.Exists(adminUiPath);
var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");

if (usingDevelopmentJwtSecretFallback)
{
    startupLogger.LogWarning("Jwt:Secret is not configured. Using the development fallback secret.");
}

if (!app.Environment.IsDevelopment() && IsDevelopmentJwtSecret(secret))
{
    startupLogger.LogWarning("A development-style JWT secret appears to be configured. Replace it before production deployment.");
}

if (app.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(app.Configuration["Email:SmtpHost"]))
{
    startupLogger.LogInformation("Email:SmtpHost is empty in Development. Verification emails will be logged instead of sent.");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerPathFeature>();
        var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("GlobalExceptionHandler");
        var env = context.RequestServices.GetRequiredService<IHostEnvironment>();
        var exception = feature?.Error;
        var statusCode = exception switch
        {
            BadHttpRequestException => StatusCodes.Status400BadRequest,
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError
        };

        logger.LogError(exception, "Unhandled exception while processing {Method} {Path}.", context.Request.Method, feature?.Path ?? context.Request.Path);

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = statusCode == StatusCodes.Status500InternalServerError
                ? "An unexpected error occurred."
                : "The request could not be processed.",
            Detail = env.IsDevelopment() ? exception?.Message : null,
            Instance = context.Request.Path
        };
        problem.Extensions["traceId"] = context.TraceIdentifier;

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problem);
    });
});

app.UseCors(AdminUiCorsPolicy);
app.UseHttpsRedirection();
app.UseAuthentication();

if (hasAdminUi)
{
    app.Use(async (context, next) =>
    {
        if (!context.Request.Path.StartsWithSegments(AdminUiRoutePrefix, out var remainingPath))
        {
            await next();
            return;
        }

        var remainingPathValue = remainingPath.Value ?? string.Empty;
        var isRootAdminRequest =
            string.IsNullOrEmpty(remainingPathValue) ||
            string.Equals(remainingPathValue, "/", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(remainingPathValue, "/index.html", StringComparison.OrdinalIgnoreCase);
        var isLoginRequest =
            string.Equals(remainingPathValue, "/login", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(remainingPathValue, "/login/", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(remainingPathValue, "/login.html", StringComparison.OrdinalIgnoreCase);
        var isDashboardRequest =
            string.Equals(remainingPathValue, "/home", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(remainingPathValue, "/home/", StringComparison.OrdinalIgnoreCase);
        var isStaticAssetRequest =
            remainingPathValue.StartsWith("/assets", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(remainingPathValue, "/login.js", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(remainingPathValue, "/app.js", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(remainingPathValue, "/styles.css", StringComparison.OrdinalIgnoreCase);

        if (isStaticAssetRequest)
        {
            await next();
            return;
        }

        if (isRootAdminRequest)
        {
            context.Response.Redirect(AdminUiLoginPath);
            return;
        }

        var authorizationService = context.RequestServices.GetRequiredService<IAuthorizationService>();
        var authorizationResult = await authorizationService.AuthorizeAsync(
            context.User,
            resource: null,
            policyName: AuthConstants.Policies.AdminOnly);

        if (isLoginRequest)
        {
            if (!string.Equals(remainingPathValue, "/login.html", StringComparison.OrdinalIgnoreCase))
            {
                context.Request.Path = $"{AdminUiRoutePrefix}/login.html";
            }
            await next();
            return;
        }

        if (!authorizationResult.Succeeded)
        {
            context.Response.Redirect(AdminUiLoginPath);
            return;
        }

        if (isDashboardRequest)
        {
            context.Request.Path = $"{AdminUiRoutePrefix}/index.html";
        }

        await next();
    });
}

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
app.UseRateLimiter();
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
            startupLogger.LogInformation("Bootstrapped initial manager admin account for {Email}.", normalizedEmail);
        }
    }
}

app.Run();

static string GetRateLimitPartitionKey(HttpContext httpContext, string prefix)
{
    var actorId =
        httpContext.User.FindFirstValue(AuthConstants.Claims.UserId) ??
        httpContext.User.FindFirstValue(AuthConstants.Claims.AdminId);

    var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    return $"{prefix}:{actorId ?? remoteIp}";
}

static bool IsDevelopmentJwtSecret(string jwtSecret)
{
    return string.Equals(jwtSecret, "dev_secret_change_me_very_long", StringComparison.Ordinal)
        || jwtSecret.Contains("local", StringComparison.OrdinalIgnoreCase)
        || jwtSecret.Contains("dev", StringComparison.OrdinalIgnoreCase);
}
