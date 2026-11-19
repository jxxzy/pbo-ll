namespace PraktikumBab10.Models;

public sealed class Barang
{
    public int Id { get; set; }
    public string KodeBarang { get; set; } = string.Empty;
    public string NamaBarang { get; set; } = string.Empty;
    public int JumlahStok { get; set; }
    public string Kategori { get; set; } = string.Empty;
}
