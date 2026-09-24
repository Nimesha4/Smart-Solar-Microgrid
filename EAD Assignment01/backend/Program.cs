using SmartSolar.Backend.Models;
using SmartSolar.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<SmartSolarDatabaseSettings>(
    builder.Configuration.GetSection("SmartSolarDatabase"));

builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<MicrogridNodeService>();
builder.Services.AddSingleton<ReservationService>();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add CORS to allow the React Frontend to communicate
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowAll");

app.UseAuthorization();
app.MapControllers();

app.Run();
