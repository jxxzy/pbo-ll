using Microsoft.EntityFrameworkCore;
using PraktikumBab10.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();

var databasePath = Path.Combine(builder.Environment.ContentRootPath, "gudang.db");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await database.Database.EnsureCreatedAsync();
}

app.UseStaticFiles();
app.UseRouting();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Barang}/{action=Index}/{id?}");
app.Run();
