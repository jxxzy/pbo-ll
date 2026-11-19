using Microsoft.EntityFrameworkCore;
using PraktikumBab09.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();

var databasePath = builder.Configuration["Lab:DatabasePath"] ?? Path.Combine(builder.Environment.ContentRootPath, "gudang-migrations.db");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await database.Database.MigrateAsync();
}

app.UseStaticFiles();
app.UseRouting();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Barang}/{action=Index}/{id?}");
app.Run();
