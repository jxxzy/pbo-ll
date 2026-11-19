using System.ComponentModel.DataAnnotations;

namespace PraktikumBab11.Models;

public sealed class BarangInput
{
    [Required, StringLength(30)]
    public string KodeBarang { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string NamaBarang { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int JumlahStok { get; set; }

    [Required, StringLength(60)]
    public string Kategori { get; set; } = string.Empty;
}
