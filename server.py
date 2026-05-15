#!/usr/bin/env python3
"""
WoA Fleet Manager - Local Dev Server
Run: python server.py
Then open: http://localhost:7000
"""
import http.server, json, os, shutil
from urllib.parse import urlparse

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "data.json")
PORT = 7000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/data":
            self._json_response(200, self._read_data())
        else:
            super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/data":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                self._write_data(data)
                self._json_response(200, {"ok": True})
            except Exception as e:
                self._json_response(400, {"error": str(e)})
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json_response(self, code, data):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _read_data(self):
        if not os.path.exists(DATA_FILE):
            return {}
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_data(self, data):
        # backup before write
        if os.path.exists(DATA_FILE):
            shutil.copy2(DATA_FILE, DATA_FILE + ".bak")
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} {fmt % args}")

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    print(f"\n  ✈  WoA Fleet Manager")
    print(f"  →  http://localhost:{PORT}\n")
    http.server.HTTPServer(("", PORT), Handler).serve_forever()