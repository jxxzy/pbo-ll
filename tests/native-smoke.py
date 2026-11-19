"""Native runtime integration tests. Run on a clean checkout with .NET 10 SDK."""
import contextlib
import http.cookiejar
import json
import os
import signal
import sqlite3
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
EXPECTED = ["Karton", "Validasi berhasil", "Biskuit", "Risiko:", "Dictionary:", "Kode barang sudah digunakan", "Pemindai Barcode"]

def project(chapter):
    return f"praktikum/bab-{chapter:02}/PraktikumBab{chapter:02}.csproj"

class FormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.token = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "input" and a.get("name") == "__RequestVerificationToken":
            self.token = a.get("value")

@contextlib.contextmanager
def running(chapter, db):
    port = 15000 + chapter
    env = {**os.environ, "Lab__DatabasePath": str(db)}
    with tempfile.TemporaryFile(mode="w+b") as log:
        proc = subprocess.Popen(["dotnet", "run", "--project", project(chapter), "--no-build", "--no-launch-profile", "--urls", f"http://127.0.0.1:{port}"], stdout=log, stderr=subprocess.STDOUT, env=env, start_new_session=True)
        base = f"http://127.0.0.1:{port}"
        try:
            for _ in range(120):
                if proc.poll() is not None:
                    raise RuntimeError(f"Bab {chapter} exited early")
                try:
                    with urllib.request.urlopen(base + ("/health" if chapter == 11 else "/"), timeout=2) as response:
                        if response.status == 200:
                            break
                except (OSError, urllib.error.URLError):
                    time.sleep(.5)
            else:
                raise RuntimeError(f"Bab {chapter} not ready")
            yield base
        finally:
            if proc.poll() is None:
                os.killpg(proc.pid, signal.SIGTERM)
                try:
                    proc.wait(timeout=8)
                except subprocess.TimeoutExpired:
                    os.killpg(proc.pid, signal.SIGKILL)
                    proc.wait()
            log.seek(0)
            print(log.read().decode(errors="replace")[-6000:], flush=True)

def request(opener, base, route, method="GET", data=None, expected=200, form=False):
    headers = {}
    if data is not None:
        data = (urllib.parse.urlencode(data) if form else json.dumps(data)).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded" if form else "application/json"
    req = urllib.request.Request(base + route, data=data, headers=headers, method=method)
    try:
        res = opener.open(req, timeout=10)
    except urllib.error.HTTPError as err:
        res = err
    with res:
        content = res.read().decode()
        assert res.status == expected, (method, route, res.status, expected, content)
        return content

def mvc_form(opener, base, route, data):
    parser = FormParser()
    parser.feed(request(opener, base, route))
    assert parser.token, f"No antiforgery token for {route}"
    return request(opener, base, route, "POST", {**data, "__RequestVerificationToken": parser.token}, form=True)

def main():
    for n in range(1, 12):
        subprocess.run(["dotnet", "build", project(n), "--nologo"], check=True, timeout=180)
    for n, expected in enumerate(EXPECTED, 1):
        result = subprocess.run(["dotnet", "run", "--project", project(n), "--no-build"], input="", text=True, capture_output=True, timeout=45, check=True)
        assert expected in result.stdout, (n, result.stdout, result.stderr)
        print(f"PASS console Bab {n}", flush=True)
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        plain = urllib.request.build_opener()
        with running(8, tmp/"8.db") as base:
            assert "Box Kardus" in request(plain, base, "/Barang")
        print("PASS MVC Bab 8", flush=True)
        for n in (9, 10):
            db = tmp/f"{n}.db"
            with running(n, db) as base:
                opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
                data = {"KodeBarang":"TEST001","NamaBarang":"BarangCI","JumlahStok":"12","Kategori":"Testing"}
                assert "BarangCI" in mvc_form(opener, base, "/Barang/Create", data)
                bad = mvc_form(opener, base, "/Barang/Create", {**data,"NamaBarang":"","JumlahStok":"-1"})
                assert "BarangCI" not in bad or "validation" in bad.lower()
                if n == 10:
                    assert "BarangEdit" in mvc_form(opener, base, "/Barang/Edit/1", {**data,"NamaBarang":"BarangEdit","Id":"1"})
                    assert "BarangEdit" not in mvc_form(opener, base, "/Barang/Delete/1", {})
            with sqlite3.connect(db) as conn:
                count = conn.execute('SELECT COUNT(*) FROM Barang').fetchone()[0]
                assert count == (1 if n == 9 else 0), (n,count)
                if n == 9:
                    assert conn.execute('SELECT COUNT(*) FROM __EFMigrationsHistory').fetchone()[0] >= 1
            print(f"PASS MVC/SQLite Bab {n}", flush=True)
        with running(11, tmp/"11.db") as base:
            assert "Warehouse API Studio" in request(plain, base, "/")
            assert "Swagger" in request(plain, base, "/swagger/index.html")
            spec = json.loads(request(plain, base, "/openapi/v1.json"))
            assert "/api/BarangApi".lower() in [p.lower() for p in spec["paths"]]
            assert json.loads(request(plain, base, "/health"))["status"] == "healthy"
            route = "/api/barangapi"
            assert json.loads(request(plain,base,route)) == []
            data = {"kodeBarang":"CI001","namaBarang":"LaptopCI","jumlahStok":10,"kategori":"Elektronik"}
            item = json.loads(request(plain,base,route,"POST",data,201))
            id = item["id"]
            assert json.loads(request(plain,base,route+f"/{id}"))["namaBarang"] == "LaptopCI"
            assert len(json.loads(request(plain,base,route+"?search=Laptop&page=1&pageSize=10&sort=nama"))) == 1
            request(plain,base,route,"POST",{**data,"jumlahStok":-1},400)
            request(plain,base,route+f"/{id}","PUT",{**data,"jumlahStok":22},204)
            assert json.loads(request(plain,base,route+f"/{id}"))["jumlahStok"] == 22
            request(plain,base,route+f"/{id}","DELETE",expected=204)
            request(plain,base,route+f"/{id}",expected=404)
        print("PASS native API Bab 11", flush=True)
    print("PASS all 11 native project smoke tests", flush=True)

if __name__ == "__main__":
    main()
