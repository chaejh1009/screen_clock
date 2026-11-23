import os
import shutil
import subprocess
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread


class ClockRequestHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/exit":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        origin = f"http://127.0.0.1:{self.server.server_port}"
        if self.headers.get("Origin") != origin:
            self.send_error(HTTPStatus.FORBIDDEN)
            return

        try:
            self.send_response(HTTPStatus.NO_CONTENT)
            self.end_headers()
        finally:
            self.server.kiosk.terminate()


def run_kiosk(command, server):
    with subprocess.Popen(command) as kiosk:
        server.kiosk = kiosk
        worker = Thread(target=server.serve_forever, daemon=True)
        try:
            worker.start()
            print(f"다른 콘솔에서 종료하려면 `kill {kiosk.pid}`를 실행하세요.", flush=True)
            return kiosk.wait()
        except KeyboardInterrupt:
            return 130
        finally:
            if worker.is_alive():
                server.shutdown()
                worker.join()
            if kiosk.poll() is None:
                kiosk.terminate()
                try:
                    kiosk.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    kiosk.kill()
                    kiosk.wait()


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

    handler = partial(ClockRequestHandler, directory=public_dir)
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
            return run_kiosk(command, server)
    except OSError as error:
        raise SystemExit(f"시계를 시작할 수 없습니다. {error}") from None


if __name__ == "__main__":
    raise SystemExit(main())
