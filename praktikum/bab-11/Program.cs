using Microsoft.EntityFrameworkCore;
using PraktikumBab11.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

var databasePath = Path.Combine(builder.Environment.ContentRootPath, "gudang.db");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await database.Database.EnsureCreatedAsync();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();
