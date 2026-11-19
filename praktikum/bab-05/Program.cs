var daftar = new List<Barang>
{
    new("BRG001", "Karton", "Kemasan", 120),
    new("BRG002", "Label", "Kemasan", 75),
    new("BRG003", "Pemindai", "Elektronik", 8)
};

// FindIndex juga tersedia di runtime WebAssembly yang dipangkas.
var posisi = daftar.FindIndex(barang => barang.KodeBarang == "BRG002");
var barangDicari = posisi >= 0 ? daftar[posisi] : null;
Console.WriteLine($"Hasil FindIndex: {barangDicari?.NamaBarang ?? "Barang tidak ditemukan"}");

var indeks = daftar.ToDictionary(barang => barang.KodeBarang);
Console.WriteLine($"Dictionary: {indeks["BRG001"].NamaBarang}");

var hasilGeneric = Pencarian.Cari(daftar, barang => barang.Kategori == "Kemasan");
Console.WriteLine($"Pencarian generic: {hasilGeneric?.NamaBarang ?? "Barang tidak ditemukan"}");

public sealed record Barang(string KodeBarang, string NamaBarang, string Kategori, int JumlahStok);

public static class Pencarian
{
    public static T? Cari<T>(IEnumerable<T> sumber, Predicate<T> kondisi) where T : class =>
        sumber.FirstOrDefault(item => kondisi(item));
}
