using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PraktikumBab10.Data;
using PraktikumBab10.Models;

namespace PraktikumBab10.Controllers;

public sealed class BarangController(ApplicationDbContext database) : Controller
{
    public async Task<IActionResult> Index() =>
        View(await database.Barang.AsNoTracking().OrderBy(barang => barang.Id).ToListAsync());

    public IActionResult Create() => View(new BarangViewModel());

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(BarangViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        database.Barang.Add(ToEntity(model));
        await database.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var barang = await database.Barang.FindAsync(id);
        return barang is null ? NotFound() : View(ToViewModel(barang));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, BarangViewModel model)
    {
        if (id != model.Id)
        {
            return BadRequest();
        }

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var barang = await database.Barang.FindAsync(id);
        if (barang is null)
        {
            return NotFound();
        }

        barang.KodeBarang = model.KodeBarang;
        barang.NamaBarang = model.NamaBarang;
        barang.JumlahStok = model.JumlahStok;
        barang.Kategori = model.Kategori;
        await database.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var barang = await database.Barang.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id);
        return barang is null ? NotFound() : View(barang);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var barang = await database.Barang.FindAsync(id);
        if (barang is null)
        {
            return NotFound();
        }

        database.Barang.Remove(barang);
        await database.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    private static Barang ToEntity(BarangViewModel model) => new()
    {
        KodeBarang = model.KodeBarang,
        NamaBarang = model.NamaBarang,
        JumlahStok = model.JumlahStok,
        Kategori = model.Kategori
    };

    private static BarangViewModel ToViewModel(Barang barang) => new()
    {
        Id = barang.Id,
        KodeBarang = barang.KodeBarang,
        NamaBarang = barang.NamaBarang,
        JumlahStok = barang.JumlahStok,
        Kategori = barang.Kategori
    };
}
