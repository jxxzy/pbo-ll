using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PraktikumBab11.Data;
using PraktikumBab11.Models;

namespace PraktikumBab11.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class BarangApiController(ApplicationDbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Barang>>> GetAll() =>
        await database.Barang.AsNoTracking().OrderBy(barang => barang.Id).ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Barang>> GetById(int id)
    {
        var barang = await database.Barang.FindAsync(id);
        return barang is null ? NotFound() : Ok(barang);
    }

    [HttpPost]
    public async Task<ActionResult<Barang>> Create(BarangInput input)
    {
        var barang = new Barang
        {
            KodeBarang = input.KodeBarang,
            NamaBarang = input.NamaBarang,
            JumlahStok = input.JumlahStok,
            Kategori = input.Kategori
        };

        database.Barang.Add(barang);
        await database.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = barang.Id }, barang);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, BarangInput input)
    {
        var barang = await database.Barang.FindAsync(id);
        if (barang is null)
        {
            return NotFound();
        }

        barang.KodeBarang = input.KodeBarang;
        barang.NamaBarang = input.NamaBarang;
        barang.JumlahStok = input.JumlahStok;
        barang.Kategori = input.Kategori;
        await database.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var barang = await database.Barang.FindAsync(id);
        if (barang is null)
        {
            return NotFound();
        }

        database.Barang.Remove(barang);
        await database.SaveChangesAsync();
        return NoContent();
    }
}
