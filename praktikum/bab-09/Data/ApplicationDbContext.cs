using Microsoft.EntityFrameworkCore;
using PraktikumBab09.Models;

namespace PraktikumBab09.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options)
{
    public DbSet<Barang> Barang => Set<Barang>();
}
