using Microsoft.EntityFrameworkCore;
using PraktikumBab11.Models;

namespace PraktikumBab11.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options)
{
    public DbSet<Barang> Barang => Set<Barang>();
}
