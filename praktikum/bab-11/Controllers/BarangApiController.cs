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
    public async Task<ActionResult<IEnumerable<Barang>>> GetAll(
        [FromQuery] string? search = null, [FromQuery] int? page = null,
        [FromQuery] int pageSize = 20, [FromQuery] string sort = "id")
    {
        if (page is < 1 or > 100000 || pageSize is < 1 or > 100)
            return BadRequest("Page 1–100000, pageSize 1–100.");
        if (sort is not ("id" or "nama" or "stok"))
            return BadRequest("Sort: id, nama, stok.");
        var query = database.Barang.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(b => b.KodeBarang.Contains(search) || b.NamaBarang.Contains(search));
        query = sort switch
        {
            "nama" => query.OrderBy(b => b.NamaBarang).ThenBy(b => b.Id),
            "stok" => query.OrderBy(b => b.JumlahStok).ThenBy(b => b.Id),
            _ => query.OrderBy(b => b.Id)
        };
        if (page is int p)
            query = query.Skip((p - 1) * pageSize).Take(pageSize);
        return await query.ToListAsync();
    }

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
