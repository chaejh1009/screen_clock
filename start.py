import os
import shutil
import subprocess
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread


def run_kiosk(command):
    with subprocess.Popen(command) as kiosk:
        try:
            print(f"다른 콘솔에서 종료하려면 `kill {kiosk.pid}`를 실행하세요.", flush=True)
            return kiosk.wait()
        except KeyboardInterrupt:
            kiosk.terminate()
            try:
                kiosk.wait(timeout=5)
            except subprocess.TimeoutExpired:
                kiosk.kill()
                kiosk.wait()
            return 130


def main():
    cage = shutil.which("cage")
    chromium = shutil.which("chromium") or shutil.which("chromium-browser")
    if not cage or not chromium:
        raise SystemExit("Cage와 Chromium을 설치하세요. sudo apt install cage chromium")
    if os.geteuid() == 0:
        raise SystemExit("라즈베리파이 콘솔에서 일반 사용자로 실행하세요. python3 start.py")
    if not os.environ.get("XDG_RUNTIME_DIR"):
        raise SystemExit("모니터가 연결된 라즈베리파이 콘솔에 로그인하고 다시 실행하세요.")

    public_dir = Path(__file__).resolve().parent / "public"
    if not (public_dir / "index.html").is_file():
        raise SystemExit("start.py와 함께 public 폴더를 복사하세요.")

    handler = partial(SimpleHTTPRequestHandler, directory=public_dir)
    try:
        with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server, TemporaryDirectory(
            prefix="screen-clock-"
        ) as profile:
            url = f"http://127.0.0.1:{server.server_port}/?kiosk=1"
            command = [
                cage, "-s", "--", chromium,
                "--ozone-platform=wayland",
                "--kiosk",
                "--no-first-run",
                "--no-default-browser-check",
                f"--user-data-dir={profile}",
                url,
            ]
            worker = Thread(target=server.serve_forever, daemon=True)
            worker.start()
            try:
                return run_kiosk(command)
            finally:
                server.shutdown()
                worker.join()
    except OSError as error:
        raise SystemExit(f"시계를 시작할 수 없습니다. {error}") from None


if __name__ == "__main__":
    raise SystemExit(main())
