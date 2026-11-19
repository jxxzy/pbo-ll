using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PraktikumBab09.Data;
using PraktikumBab09.Models;

namespace PraktikumBab09.Controllers;

public sealed class BarangController(ApplicationDbContext database) : Controller
{
    public async Task<IActionResult> Index() =>
        View(await database.Barang.AsNoTracking().OrderBy(barang => barang.Id).ToListAsync());

    public IActionResult Create() => View(new Barang());

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(
        [Bind("KodeBarang,NamaBarang,JumlahStok,Kategori")] Barang barang)
    {
        if (!ModelState.IsValid)
        {
            return View(barang);
        }

        database.Barang.Add(barang);
        await database.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }
}
