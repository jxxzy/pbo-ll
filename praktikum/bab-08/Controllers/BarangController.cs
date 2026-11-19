using Microsoft.AspNetCore.Mvc;
using PraktikumBab08.Models;

namespace PraktikumBab08.Controllers;

public sealed class BarangController : Controller
{
    public IActionResult Index()
    {
        IReadOnlyList<BarangRingkas> daftar =
        [
            new("BRG001", "Box Kardus", 120),
            new("BRG002", "Label", 75)
        ];

        return View(daftar);
    }
}
