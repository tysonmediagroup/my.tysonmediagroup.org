#!/usr/bin/env python3
import http.server
import json
import os
import urllib.parse

PORT = 8097
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(DIRECTORY, ".local_profiles.json")
ACCOUNTS_FILE = os.path.join(DIRECTORY, ".local_accounts.json")

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

def load_accounts():
    if os.path.exists(ACCOUNTS_FILE):
        try:
            with open(ACCOUNTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_accounts(accounts):
    try:
        with open(ACCOUNTS_FILE, "w", encoding="utf-8") as f:
            json.dump(accounts, f)
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
        if parsed.path in ["/api/profile", "/api/accounts"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        super().do_HEAD()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/accounts":
            accounts = load_accounts()
            body = json.dumps(accounts).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
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
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            data = {}

        if parsed.path == "/api/accounts":
            slug = (data.get("slug") or data.get("username") or "").lower().replace("@tysonmediagroup.org", "").strip()
            if not slug:
                self.send_response(400)
                self.end_headers()
                return
            if not data.get("isPowerAdmin") and len(slug) < 3:
                resp = json.dumps({"ok": False, "error": "Username must be at least 3 characters long."}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(resp)
                return

            accounts = load_accounts()
            idx = -1
            for i, a in enumerate(accounts):
                if a.get("slug", "").lower() == slug:
                    idx = i
                    break
            data["slug"] = slug
            data["isDynamic"] = True
            if idx >= 0:
                accounts[idx].update(data)
            else:
                accounts.append(data)
            save_accounts(accounts)
            resp = json.dumps({"ok": True, "account": data}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return

        if parsed.path == "/api/auth/register":
            slug = (data.get("slug") or data.get("username") or "").lower().replace("@tysonmediagroup.org", "").strip()
            if len(slug) < 3:
                resp = json.dumps({"ok": False, "error": "Username must be at least 3 characters long."}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(resp)
                return

            accounts = load_accounts()
            for a in accounts:
                if a.get("slug", "").lower() == slug:
                    resp = json.dumps({"ok": False, "error": "Account already exists."}).encode("utf-8")
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(resp)
                    return

            d_name = data.get("displayName") or " ".join(filter(None, [data.get("firstName"), data.get("lastName")])) or slug
            new_acc = {
                "name": d_name,
                "firstName": data.get("firstName", ""),
                "lastName": data.get("lastName", ""),
                "showRealName": data.get("showRealName") is not False,
                "username": f"{slug}@tysonmediagroup.org",
                "slug": slug,
                "password": data.get("password", "password123"),
                "team": "N",
                "badge": "Standard Member",
                "badgeClass": "badge-member",
                "hasTysonBadge": False,
                "role": "Registered Member",
                "division": "TYSON Media Group",
                "bio": data.get("bio") or f"myTYSON profile for {d_name}.",
                "isDynamic": True
            }
            accounts.append(new_acc)
            save_accounts(accounts)

            # Profile defaults
            profiles = load_profiles()
            profiles[slug] = {
                "displayName": d_name,
                "firstName": new_acc["firstName"],
                "lastName": new_acc["lastName"],
                "showRealName": new_acc["showRealName"],
                "bio": new_acc["bio"],
                "division": new_acc["division"]
            }
            save_profiles(profiles)

            resp = json.dumps({"ok": True, "account": new_acc}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return

        if parsed.path == "/api/profile":
            qs = urllib.parse.parse_qs(parsed.query)
            slug = (qs.get("slug", [""])[0]).lower()
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

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/accounts":
            qs = urllib.parse.parse_qs(parsed.query)
            slug = (qs.get("slug", [""])[0]).lower()
            if slug in ["tyson", "t"]:
                resp = json.dumps({"ok": False, "error": "Cannot delete root admin account"}).encode("utf-8")
                self.send_response(403)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(resp)
                return
            accounts = [a for a in load_accounts() if a.get("slug", "").lower() != slug]
            save_accounts(accounts)
            profiles = load_profiles()
            if slug in profiles:
                del profiles[slug]
                save_profiles(profiles)
            resp = json.dumps({"ok": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(resp)
            return
        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("", PORT), MyTysonHandler)
    print(f"Serving myTYSON dashboard with /api/profile on http://localhost:{PORT}")
    server.serve_forever()
