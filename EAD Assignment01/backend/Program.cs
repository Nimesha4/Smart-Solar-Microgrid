using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<SmartSolarDatabaseSettings>(
    builder.Configuration.GetSection("SmartSolarDatabase"));

builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<MicrogridNodeService>();
builder.Services.AddSingleton<ReservationService>();
builder.Services.AddSingleton<TransactionService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

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
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => "ok");

app.Run();