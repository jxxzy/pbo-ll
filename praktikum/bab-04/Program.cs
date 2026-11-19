ItemGudang[] daftar =
[
    new BarangKimia("KIM001", "Pembersih Industri", 2),
    new BarangMakanan("MKN001", "Susu UHT", new DateTime(2027, 4, 30))
];

foreach (var item in daftar)
{
    item.CetakInfo();
    Console.WriteLine($"Risiko: {item.EvaluasiRisiko()}");

    if (item is IPeriksaKadaluarsa dapatDiperiksa)
    {
        Console.WriteLine($"Kadaluarsa: {dapatDiperiksa.PeriksaKadaluarsa(DateTime.Today)}");
    }
}

public abstract class ItemGudang
{
    public string Kode { get; }
    public string Nama { get; }

    protected ItemGudang(string kode, string nama)
    {
        Kode = kode;
        Nama = nama;
    }

    public abstract string EvaluasiRisiko();

    public virtual void CetakInfo() => Console.WriteLine($"[{Kode}] {Nama}");
}

public sealed class BarangKimia(string kode, string nama, int tingkatBahaya) : ItemGudang(kode, nama)
{
    public override string EvaluasiRisiko() =>
        tingkatBahaya >= 3 ? "Simpan terpisah dan gunakan APD." : "Simpan sesuai label produk.";
}

public interface IPeriksaKadaluarsa
{
    string PeriksaKadaluarsa(DateTime tanggalHariIni);
}

public sealed class BarangMakanan(string kode, string nama, DateTime tanggalKadaluarsa)
    : ItemGudang(kode, nama), IPeriksaKadaluarsa
{
    public override string EvaluasiRisiko() =>
        tanggalKadaluarsa <= DateTime.Today.AddDays(30)
            ? "Perlu pemeriksaan masa simpan."
            : "Masa simpan masih aman.";

    public string PeriksaKadaluarsa(DateTime tanggalHariIni) =>
        tanggalKadaluarsa < tanggalHariIni ? "Sudah kedaluwarsa" : "Belum kedaluwarsa";
}
