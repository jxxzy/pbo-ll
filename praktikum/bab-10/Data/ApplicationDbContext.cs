using Microsoft.EntityFrameworkCore;
using PraktikumBab10.Models;

namespace PraktikumBab10.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options)
{
    public DbSet<Barang> Barang => Set<Barang>();
}
