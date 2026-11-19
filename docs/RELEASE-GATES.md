# PBO II Learning Studio V2 — release gates

Stable is not claimed until the relevant evidence is green: build and run of 11 .NET projects, console output checks, actual MVC/API integration tests including SQLite migration and validation, browser WASM/SQLite end-to-end tests, mobile smoke, and Pages deployment. CI has jobs for these; consult Actions for observed results.

Current architecture: GitHub Pages is static. Console C# uses browser WASM. MVC/API browser labs use SQLite and JavaScript teaching logic, not the edited C# source. The native projects run in a private Codespace or local Docker with trusted code. An arbitrary-code public ASP.NET backend is intentionally not deployed. Do not publish the local runner.

Remaining release gates: PDF-to-content page-level verification, wider browser/platform and accessibility testing, Docker Windows runtime, full C# semantic editor and true multi-file browser compiler, public secure hosted backend (requires infrastructure), full automated course grading. CI smoke tests are not an exhaustive unit-test suite. The current release is a candidate, not a final stable declaration.

Private Codespaces IDE source is available via start-private-ide.sh. This mode needs private forwarded ports, a session code and a working nested Docker daemon. It does not turn GitHub Pages into a compiler host. Codespaces end-to-end launch still requires verification in a real Codespace.

WASM regression tracking: static binary URLs are normalized and hosting worker sidecar mode is set before .NET initialization (upstream runtime issue #114918). Runtime checks remain mandatory; do not interpret packaging success alone as a passing browser compiler.
