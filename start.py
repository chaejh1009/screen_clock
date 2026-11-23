import json
import os
import shutil
import subprocess
from functools import partial
from http import HTTPStatus
from http.client import HTTPException
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Event, Thread
from urllib.parse import urlsplit
from urllib.request import urlopen


REVIEW_URL = "https://raw.githubusercontent.com/chaejh1009/screen_clock/main/public/review.json"
REVIEW_REFRESH_SECONDS = 600
REVIEW_MAX_BYTES = 32 * 1024


def valid_review(content):
    if len(content) > REVIEW_MAX_BYTES:
        return False

    try:
        data = json.loads(content)
        project = data["project"]
        publication = data["publication"]
        checklist = project["checklist"]
        rules = publication["rules"]
        if not isinstance(checklist, list) or not checklist or not isinstance(rules, list) or not rules:
            return False

        strings = [
            project["heading"],
            project["intro"],
            publication["heading"],
            publication["titleLabel"],
            publication["titleNote"],
            *checklist,
        ]
        for rule in rules:
            strings.extend((rule["label"], rule["value"]))
        return (
            all(isinstance(value, str) and value.strip() for value in strings)
            and isinstance(publication.get("title", ""), str)
        )
    except (ValueError, KeyError, TypeError):
        return False


def read_bundled_review(path):
    try:
        with path.open("rb") as source:
            content = source.read(REVIEW_MAX_BYTES + 1)
    except OSError:
        return None
    return content if valid_review(content) else None


def sync_review(server, stop):
    while not stop.is_set():
        try:
            with urlopen(REVIEW_URL, timeout=5) as response:
                content = response.read(REVIEW_MAX_BYTES + 1)
        except (OSError, HTTPException):
            pass
        else:
            if valid_review(content):
                server.review_content = content
        stop.wait(REVIEW_REFRESH_SECONDS)


class ClockRequestHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        if urlsplit(self.path).path != "/review.json":
            return super().send_head()

        content = self.server.review_content
        if content is None:
            self.send_error(HTTPStatus.SERVICE_UNAVAILABLE)
            return None

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        return BytesIO(content)

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
            server.review_content = read_bundled_review(public_dir / "review.json")
            sync_stop = Event()
            Thread(target=sync_review, args=(server, sync_stop), daemon=True).start()
            try:
                return run_kiosk(command, server)
            finally:
                sync_stop.set()
    except OSError as error:
        raise SystemExit(f"시계를 시작할 수 없습니다. {error}") from None


if __name__ == "__main__":
    raise SystemExit(main())
