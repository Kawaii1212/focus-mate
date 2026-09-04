using FocusMate.Backend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();

// Configure CORS for Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // allow any origin for LAN play
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
}

app.UseCors("AllowNextJs");

app.MapHub<CoStudyHub>("/hubs/costudy");

app.MapGet("/", () => "FocusMate Backend is running!");

// Run on port 5006 for all IPs
app.Run("http://*:5006");
