// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: Program.cs
// Description: Application entry point configuring dependency injection, middleware, and HTTP pipeline.
// ============================================================================

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using SmartSolar.Backend.Authorization;
using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure MongoDB database settings from appsettings.json
builder.Services.Configure<SmartSolarDatabaseSettings>(
    builder.Configuration.GetSection("SmartSolarDatabase"));

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// Register singleton data access services for dependency injection
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<MicrogridNodeService>();
builder.Services.AddSingleton<ReservationService>();
builder.Services.AddSingleton<TransactionService>();
builder.Services.AddSingleton<JwtTokenService>();

// Add controllers and OpenAPI document generation
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
var signingKey = Encoding.UTF8.GetBytes(jwtSettings.Key);

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(signingKey),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("BackofficeOnly", policy => policy.RequireRole("Backoffice"));
    options.AddPolicy("GridOperatorOnly", policy => policy.RequireRole("GridOperator"));
    options.AddPolicy("ProsumerOnly", policy => policy.RequireRole("Prosumer"));
    options.AddPolicy("BackofficeOrGridOperator", policy => policy.RequireRole("Backoffice", "GridOperator"));
    options.AddPolicy("BackofficeOrProsumer", policy => policy.RequireRole("Backoffice", "Prosumer"));
});

builder.Services.AddSingleton<IAuthorizationHandler, RoleAuthorizationHandler>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Render terminates HTTPS in front of the container, so no redirection here.
// Only redirect locally if you want to.
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Exposes /openapi/v1.json in all environments (JSON only, no UI).
// Wrap in IsDevelopment() again if you don't want it public.
app.MapOpenApi();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => "ok");

app.Run();