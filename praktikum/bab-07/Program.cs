IBarangPrinter printer = new PencetakBarang();
var daftarBarang = new[]
{
    BarangFactory.BuatBarang("elektronik", "ELK001", "Pemindai Barcode", 8),
    BarangFactory.BuatBarang("makanan", "MKN001", "Biskuit", 24),
    BarangFactory.BuatBarang("umum", "BRG001", "Karton", 120)
};

foreach (var barang in daftarBarang)
{
    printer.Cetak(barang);
}

public sealed record Barang(string Kode, string Nama, int Stok, string Jenis);

public interface IBarangPrinter
{
    void Cetak(Barang barang);
}

public sealed class PencetakBarang : IBarangPrinter
{
    public void Cetak(Barang barang) =>
        Console.WriteLine($"[{barang.Jenis}] {barang.Kode} - {barang.Nama}: {barang.Stok}");
}

public static class BarangFactory
{
    public static Barang BuatBarang(string tipe, string kode, string nama, int stok)
    {
        var stokValid = InputHelper.AmbilStokValid(stok.ToString());
        var jenis = tipe.Trim().ToLowerInvariant() switch
        {
            "elektronik" => "Elektronik",
            "makanan" => "Makanan",
            "umum" => "Umum",
            _ => throw new ArgumentException($"Jenis barang '{tipe}' tidak dikenal.", nameof(tipe))
        };

        return new Barang(kode, nama, stokValid, jenis);
    }
}

public static class InputHelper
{
    public static int AmbilStokValid(string input)
    {
        if (!int.TryParse(input, out var stok) || stok < 0)
        {
            throw new ArgumentException("Stok harus berupa angka nol atau lebih.", nameof(input));
        }

        return stok;
    }
}
