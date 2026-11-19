var daftarBarang = new[]
{
    new Barang("BRG001", "Karton", 120, "Kemasan"),
    new Barang("BRG002", "Bubble Wrap", 40, "Pelindung"),
    new Barang()
};

foreach (var barang in daftarBarang)
{
    barang.TampilkanInfo();
}

public class Barang
{
    public string KodeBarang;
    public string NamaBarang;
    public int JumlahStok;
    public string Kategori;

    public Barang() : this("BRG000", "Barang Baru", 0, "Umum") { }

    public Barang(string kodeBarang, string namaBarang, int jumlahStok, string kategori)
    {
        KodeBarang = kodeBarang;
        NamaBarang = namaBarang;
        JumlahStok = jumlahStok;
        Kategori = kategori;
    }

    public string StatusStok() => JumlahStok > 50 ? "Stok aman" : "Perlu reorder";

    public void TampilkanInfo()
    {
        Console.WriteLine(
            $"[{KodeBarang}] {NamaBarang} - Stok: {JumlahStok}, Kategori: {Kategori} ({StatusStok()})");
    }
}
