using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using PraktikumBab09.Data;

#nullable disable
namespace PraktikumBab09.Migrations;

[DbContext(typeof(ApplicationDbContext))]
public sealed class ApplicationDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder) => ConfigureModel(modelBuilder);
    internal static void ConfigureModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasAnnotation("ProductVersion", "10.0.15");
        modelBuilder.Entity("PraktikumBab09.Models.Barang", b =>
        {
            b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("INTEGER");
            b.Property<string>("KodeBarang").IsRequired().HasMaxLength(30).HasColumnType("TEXT");
            b.Property<string>("NamaBarang").IsRequired().HasMaxLength(100).HasColumnType("TEXT");
            b.Property<int>("JumlahStok").HasColumnType("INTEGER");
            b.Property<string>("Kategori").IsRequired().HasMaxLength(60).HasColumnType("TEXT");
            b.HasKey("Id");
            b.ToTable("Barang");
        });
    }
}
