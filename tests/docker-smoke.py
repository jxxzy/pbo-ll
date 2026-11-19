"""Exercise the actual Docker runner; never expose the port publicly."""
import json
import os
import signal
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
BASE = "http://127.0.0.1:8787"
ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)

def call(route, data=None, expect=200, token=None, origin=BASE):
    headers = {}
    if token:
        headers["X-PBO-Session"] = token
    if data is not None:
        headers.update({"Content-Type": "application/json", "Origin": origin})
    req=urllib.request.Request(BASE+"/lab-api/"+route,headers=headers,data=json.dumps(data).encode() if data is not None else None)
    try:
        res=urllib.request.urlopen(req,timeout=40)
    except urllib.error.HTTPError as e:
        res=e
    with res:
        body=res.read().decode()
        assert res.status==expect,(route,res.status,body)
        return json.loads(body)

def wait_state(condition, seconds=150):
    until=time.monotonic()+seconds
    while time.monotonic()<until:
        state=call("status")
        if condition(state):return state
        time.sleep(.5)
    raise AssertionError("Runner timeout: "+str(state))

def main():
    manifest=json.loads(Path("dist/playground/manifest.json").read_text())
    expected=["Karton","Validasi berhasil","Biskuit","Risiko:","Dictionary:","Kode barang sudah digunakan","Pemindai Barcode"]
    with tempfile.TemporaryFile(mode="w+b") as log:
        p=subprocess.Popen(["node","scripts/playground-server.mjs"],stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
        try:
            for _ in range(60):
                try:
                    assert call("health")["available"]
                    break
                except (OSError,urllib.error.URLError):
                    time.sleep(.5)
            else:raise AssertionError("Runner did not start")
            call("run",{},expect=403,origin="https://example.invalid")
            call("run",{"chapter":1,"files":{"../bad.cs":"bad"}},expect=400)
            for lab in manifest:
                n=lab["chapter"]; dir=Path(f"dist/praktikum/bab-{n:02}")
                files={name:(dir/name).read_text(encoding="utf-8") for name in lab["files"]}
                call("run",{"chapter":n,"files":files,"stdin":""})
                if n<=7:
                    state=wait_state(lambda s:not s["running"])
                    assert state["state"]=="Exit code 0" and expected[n-1] in state["output"],state
                else:
                    state=wait_state(lambda s:s["ready"] or not s["running"])
                    assert state["ready"],state
                    with urllib.request.urlopen(state["url"],timeout=15) as res:
                        assert res.status==200
                        page=res.read().decode()
                    if n==11:
                        assert "Warehouse API Studio" in page
                        data={"kodeBarang":"DOCKER","namaBarang":"DockerCI","jumlahStok":8,"kategori":"CI"}
                        response=call("api",{"method":"POST","path":"/api/barangapi","body":json.dumps(data)})
                        assert response["status"]==201,response
                        item=json.loads(response["body"]); id=item["id"]
                        assert call("api",{"method":"GET","path":"/api/barangapi/"+str(id)})["status"]==200
                        assert call("api",{"method":"DELETE","path":"/api/barangapi/"+str(id)})["status"]==204
                    call("stop",{})
                    wait_state(lambda s:not s["running"])
                print(f"PASS Docker lab Bab {n}",flush=True)
            leftovers=subprocess.check_output(["docker","ps","-aq","--filter","label=pbo2.local-lab=true"],text=True).strip()
            assert not leftovers,leftovers
        finally:
            if p.poll() is None:
                os.killpg(p.pid,signal.SIGTERM)
                try:p.wait(timeout=20)
                except subprocess.TimeoutExpired:
                    os.killpg(p.pid,signal.SIGKILL);p.wait()
            log.seek(0);print(log.read().decode(errors="replace")[-6000:],flush=True)
            # Remove only containers specifically labeled by this isolated CI test.
            ids=subprocess.check_output(["docker","ps","-aq","--filter","label=pbo2.local-lab=true"],text=True).split()
            if ids:subprocess.run(["docker","rm","-f",*ids],check=False)

if __name__=="__main__":
    main()
