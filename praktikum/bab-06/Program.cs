var daftarBarang = new List<Barang>
{
    new("BRG001", "Karton", 120),
    new("BRG002", "Label", 75)
};

try
{
    foreach (var teks in new[] { "42", "bukan-angka" })
    {
        try
        {
            Console.WriteLine($"Stok dari input '{teks}': {int.Parse(teks)}");
        }
        catch (FormatException ex)
        {
            Console.WriteLine($"Input tidak valid: {ex.Message}");
        }
    }

    try
    {
        daftarBarang[0].JumlahStok = -1;
    }
    catch (StokNegatifException ex)
    {
        Console.WriteLine(ex.Message);
    }

    var path = Path.Combine(AppContext.BaseDirectory, "data_barang.txt");
    File.WriteAllText(path, "Kode\tNama\tStok" + Environment.NewLine);
    foreach (var barang in daftarBarang)
    {
        File.AppendAllText(path, $"{barang.KodeBarang}\t{barang.NamaBarang}\t{barang.JumlahStok}{Environment.NewLine}");
    }

    Console.WriteLine($"Catatan barang disimpan di {path}");
    foreach (var baris in File.ReadAllLines(path))
    {
        Console.WriteLine(baris);
    }
}
catch (IOException ex)
{
    Console.Error.WriteLine($"File tidak dapat diproses: {ex.Message}");
}
finally
{
    Console.WriteLine("Proses praktikum selesai.");
}

public sealed class StokNegatifException(string message) : Exception(message);

public sealed class Barang
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
                throw new StokNegatifException("Jumlah stok tidak boleh negatif.");
            }

            jumlahStok = value;
        }
    }

    public Barang(string kodeBarang, string namaBarang, int jumlahStok)
    {
        KodeBarang = kodeBarang;
        NamaBarang = namaBarang;
        JumlahStok = jumlahStok;
    }
}
