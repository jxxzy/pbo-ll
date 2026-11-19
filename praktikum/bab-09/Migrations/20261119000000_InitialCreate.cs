using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PraktikumBab09.Data;

#nullable disable
namespace PraktikumBab09.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261119000000_InitialCreate")]
public sealed class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Barang",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false).Annotation("Sqlite:Autoincrement", true),
                KodeBarang = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                NamaBarang = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                JumlahStok = table.Column<int>(type: "INTEGER", nullable: false),
                Kategori = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_Barang", x => x.Id));
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("Barang");
    protected override void BuildTargetModel(ModelBuilder modelBuilder) => ApplicationDbContextModelSnapshot.ConfigureModel(modelBuilder);
}
