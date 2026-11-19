using System.ComponentModel.DataAnnotations;

namespace PraktikumBab09.Models;

public sealed class Barang
{
    public int Id { get; set; }

    [Required, StringLength(30)]
    public string KodeBarang { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string NamaBarang { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int JumlahStok { get; set; }

    [StringLength(60)]
    public string Kategori { get; set; } = string.Empty;
}
