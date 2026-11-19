using Microsoft.AspNetCore.Mvc;

namespace PraktikumBab08.Controllers;

public sealed class HomeController : Controller
{
    public IActionResult Index() => View();
}
