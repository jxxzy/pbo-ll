using Microsoft.EntityFrameworkCore;
using PraktikumBab11.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var databasePath = builder.Configuration["Lab:DatabasePath"] ?? Path.Combine(builder.Environment.ContentRootPath, "gudang.db");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await database.Database.EnsureCreatedAsync();
}

// Codespaces terminates HTTPS at its private port proxy. Local Kestrel uses HTTP.
if (builder.Configuration.GetValue<bool>("Lab:RedirectHttps"))
    app.UseHttpsRedirection();
app.UseExceptionHandler();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapOpenApi();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("../openapi/v1.json", "PBO II Bab 11 v1");
    options.DocumentTitle = "PBO II | REST API";
});
app.MapGet("/health", async (ApplicationDbContext database) =>
{
    var ready = await database.Database.CanConnectAsync();
    return Results.Json(new { status = ready ? "healthy" : "unavailable", database = "SQLite" }, statusCode: ready ? 200 : 503);
});
app.MapControllers();
app.Run();
