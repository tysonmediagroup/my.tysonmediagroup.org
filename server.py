#!/usr/bin/env python3
import http.server
import json
import os
import urllib.parse

PORT = 8097
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(DIRECTORY, ".local_profiles.json")

def load_profiles():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_profiles(profiles):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles, f)
    except Exception:
        pass

class MyTysonHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/profile":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        super().do_HEAD()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/profile":
            qs = urllib.parse.parse_qs(parsed.query)
            slug = (qs.get("slug", [""])[0]).lower()
            profiles = load_profiles()
            data = profiles.get(slug, {})
            body = json.dumps(data).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/profile":
            qs = urllib.parse.parse_qs(parsed.query)
            slug = (qs.get("slug", [""])[0]).lower()
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length)
            try:
                data = json.loads(raw.decode("utf-8"))
            except Exception:
                data = {}
            if slug:
                profiles = load_profiles()
                profiles[slug] = data
                save_profiles(profiles)
            resp = json.dumps({"ok": True, "profile": data}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return
        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("", PORT), MyTysonHandler)
    print(f"Serving myTYSON dashboard with /api/profile on http://localhost:{PORT}")
    server.serve_forever()
