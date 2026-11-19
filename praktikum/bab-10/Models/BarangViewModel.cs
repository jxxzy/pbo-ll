using System.ComponentModel.DataAnnotations;

namespace PraktikumBab10.Models;

public sealed class BarangViewModel
{
    public int Id { get; set; }

    [Required, StringLength(30), Display(Name = "Kode Barang")]
    public string KodeBarang { get; set; } = string.Empty;

    [Required, StringLength(100), Display(Name = "Nama Barang")]
    public string NamaBarang { get; set; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "Stok tidak boleh negatif.")]
    [Display(Name = "Jumlah Stok")]
    public int JumlahStok { get; set; }

    [StringLength(60)]
    public string Kategori { get; set; } = string.Empty;
}
