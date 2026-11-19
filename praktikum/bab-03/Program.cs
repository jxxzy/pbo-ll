Barang[] daftarBarang =
[
    new Barang("BRG001", "Karton", 120),
    new BarangElektronik("ELK001", "Pemindai Barcode", 8, 24),
    new BarangMakanan("MKN001", "Biskuit", 24, new DateOnly(2027, 4, 30))
];

foreach (var barang in daftarBarang)
{
    barang.TampilkanInfo();
}

public class Barang
{
    public string KodeBarang { get; }
    public string NamaBarang { get; }
    public int JumlahStok { get; }

    public Barang(string kodeBarang, string namaBarang, int jumlahStok)
    {
        KodeBarang = kodeBarang;
        NamaBarang = namaBarang;
        JumlahStok = jumlahStok;
    }

    public virtual void TampilkanInfo() =>
        Console.WriteLine($"[{KodeBarang}] {NamaBarang} - Stok: {JumlahStok}");
}

public sealed class BarangElektronik : Barang
{
    public int DayaListrikWatt { get; }

    public BarangElektronik(string kodeBarang, string namaBarang, int jumlahStok, int dayaListrikWatt)
        : base(kodeBarang, namaBarang, jumlahStok)
    {
        DayaListrikWatt = dayaListrikWatt;
    }

    public override void TampilkanInfo() =>
        Console.WriteLine($"[{KodeBarang}] {NamaBarang} - Stok: {JumlahStok}, Daya: {DayaListrikWatt} W");
}

public sealed class BarangMakanan(string kode, string nama, int stok, DateOnly kedaluwarsa) : Barang(kode, nama, stok)
{
    public override void TampilkanInfo() => Console.WriteLine($"[{KodeBarang}] {NamaBarang} - Stok: {JumlahStok}, Kedaluwarsa: {kedaluwarsa:yyyy-MM-dd}");
}
