var daftarBarang = new[]
{
    new Barang("BRG001", "Karton", 120),
    new Barang("BRG002", "Label", 20)
};

foreach (var barang in daftarBarang)
{
    Console.WriteLine($"{barang.KodeBarang} - {barang.NamaBarang}: {barang.JumlahStok} ({barang.Status})");
}

try
{
    daftarBarang[0].JumlahStok = -1;
}
catch (ArgumentOutOfRangeException ex)
{
    Console.WriteLine($"Validasi berhasil: {ex.Message}");
}

public class Barang
{
    private int jumlahStok;

    public string KodeBarang { get; }
    public string NamaBarang { get; }

    public int JumlahStok
    {
        get => jumlahStok;
        set
        {
            if (value < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(value), "Stok tidak boleh negatif.");
            }

            jumlahStok = value;
        }
    }

    public string Status => JumlahStok > 50 ? "Stok aman" : "Perlu reorder";

    public Barang(string kodeBarang, string namaBarang, int jumlahStok)
    {
        KodeBarang = kodeBarang;
        NamaBarang = namaBarang;
        JumlahStok = jumlahStok;
    }
}
