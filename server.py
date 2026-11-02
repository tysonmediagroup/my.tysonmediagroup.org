#!/usr/bin/env python3
import hashlib
import hmac
import http.server
import json
import os
import time
import urllib.parse
import urllib.request

PORT = 8097
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(DIRECTORY, ".local_profiles.json")
ACCOUNTS_FILE = os.path.join(DIRECTORY, ".local_accounts.json")
HMAC_SECRET = os.environ.get("SESSION_SECRET", "mytyson-edge-hmac-default-key-2026-tmg").encode("utf-8")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "1054168096128-2er1dlrrkeqphr2bu8vpsa4v1rd99reg.apps.googleusercontent.com")

def hash_password(password, slug):
    clean = (slug or "").lower().replace("@tysonmediagroup.org", "").strip()
    raw = f"mytyson_salt_v1:{clean}:{(password or '').strip()}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def sign_payload(payload_obj):
    canonical = json.dumps(payload_obj, separators=(",", ":")).encode("utf-8")
    sig = hmac.new(HMAC_SECRET, canonical, hashlib.sha256).hexdigest()
    return {"payload": payload_obj, "sig": sig}

def verify_payload(payload_obj, sig):
    if not payload_obj or not sig:
        return False
    canonical = json.dumps(payload_obj, separators=(",", ":")).encode("utf-8")
    expected = hmac.new(HMAC_SECRET, canonical, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)

def is_staff_team(team_val):
    return team_val in ("Y", True, "Official TYSON Account", "Official Support Account")

def sanitize_account(acc, include_private_email=False):
    if not acc:
        return None
    copy = dict(acc)
    clean_slug = (copy.get("slug") or copy.get("username") or "").lower().replace("@tysonmediagroup.org", "").strip()
    staff = is_staff_team(copy.get("team"))
    copy["slug"] = clean_slug
    copy["team"] = "Y" if staff else "N"
    copy["username"] = f"{clean_slug}@tysonmediagroup.org" if staff else clean_slug
    copy["googleLinked"] = bool(copy.get("googleSub") or copy.get("googleEmail"))
    for k in ("password", "altPasswords", "passwordHash", "passwordHashes", "googleSub"):
        copy.pop(k, None)
    if not include_private_email:
        copy.pop("googleEmail", None)
    return copy

def issue_session(acc):
    clean_slug = (acc.get("slug") or "").lower().replace("@tysonmediagroup.org", "").strip()
    staff = is_staff_team(acc.get("team"))
    core = {
        "name": acc.get("name") or clean_slug,
        "username": f"{clean_slug}@tysonmediagroup.org" if staff else clean_slug,
        "slug": clean_slug,
        "team": "Y" if staff else "N",
        "badge": acc.get("badge") or ("TYSON Team" if staff else "Standard Member"),
        "hasTysonBadge": bool(acc.get("hasTysonBadge", staff)),
        "googleLinked": bool(acc.get("googleSub") or acc.get("googleEmail")),
        "googleEmail": acc.get("googleEmail") or "",
        "ts": int(time.time() * 1000)
    }
    signed = sign_payload(core)
    core["sig"] = signed["sig"]
    return core

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

def verify_google_token(credential, access_token):
    if credential:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(credential)}"
        req = urllib.request.Request(url)
    elif access_token:
        url = "https://www.googleapis.com/oauth2/v3/userinfo"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access_token}"})
    else:
        raise ValueError("Missing Google credential or access token.")
    with urllib.request.urlopen(req, timeout=8) as resp:
        info = json.loads(resp.read().decode("utf-8"))
    if not info.get("sub") or not info.get("email"):
        raise ValueError("Google token did not include required account identity.")
    email = info["email"].lower()
    prefix = "".join(c for c in email.split("@")[0] if c.isalnum() or c in "._-")
    suggested = prefix[:24] if len(prefix) >= 3 else f"{prefix or 'user'}123"
    return {
        "sub": str(info["sub"]),
        "email": email,
        "name": info.get("name") or suggested,
        "firstName": info.get("given_name") or "",
        "lastName": info.get("family_name") or "",
        "picture": info.get("picture") or "",
        "suggestedSlug": suggested
    }

class MyTysonHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

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
            accounts = [sanitize_account(a, False) for a in load_accounts()]
            self.send_json(accounts)
            return
        if parsed.path == "/api/auth/google":
            self.send_json({"ok": True, "clientId": GOOGLE_CLIENT_ID})
            return
        if parsed.path == "/api/profile":
            qs = urllib.parse.parse_qs(parsed.query)
            slug = (qs.get("slug", [""])[0]).lower().replace("@tysonmediagroup.org", "")
            profiles = load_profiles()
            self.send_json(profiles.get(slug, {}))
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

        if parsed.path == "/api/auth/login":
            ident = (data.get("username") or data.get("slug") or "").lower().replace("@tysonmediagroup.org", "").strip()
            pw = data.get("password") or ""
            accounts = load_accounts()
            matched = next((a for a in accounts if a.get("slug", "").lower() == ident), None)
            if not matched:
                self.send_json({"ok": False, "error": "Invalid myTYSON username or password."}, 401)
                return
            pw_hash = hash_password(pw, ident)
            hashes = matched.get("passwordHashes") or []
            if pw_hash not in hashes and matched.get("password") != pw:
                self.send_json({"ok": False, "error": "Invalid myTYSON username or password."}, 401)
                return
            self.send_json({"ok": True, "account": sanitize_account(matched, True), "session": issue_session(matched)})
            return

        if parsed.path == "/api/accounts":
            slug = (data.get("slug") or data.get("username") or "").lower().replace("@tysonmediagroup.org", "").strip()
            if not slug:
                self.send_json({"ok": False, "error": "Username/slug is required."}, 400)
                return
            if not data.get("isPowerAdmin") and len(slug) < 3 and slug not in ("tyson", "t", "ash", "a"):
                self.send_json({"ok": False, "error": "Username must be at least 3 characters long."}, 400)
                return

            accounts = load_accounts()
            idx = next((i for i, a in enumerate(accounts) if a.get("slug", "").lower() == slug), -1)
            staff = is_staff_team(data.get("team"))
            data["slug"] = slug
            data["team"] = "Y" if staff else "N"
            data["username"] = f"{slug}@tysonmediagroup.org" if staff else slug
            data["isDynamic"] = True
            if data.get("password"):
                data["passwordHashes"] = [hash_password(data.pop("password"), slug)]
            if idx >= 0:
                accounts[idx].update(data)
                saved = accounts[idx]
            else:
                accounts.append(data)
                saved = data
            save_accounts(accounts)
            self.send_json({"ok": True, "account": sanitize_account(saved, True)})
            return

        if parsed.path == "/api/auth/register":
            slug = (data.get("slug") or data.get("username") or "").lower().replace("@tysonmediagroup.org", "").strip()
            if len(slug) < 3:
                self.send_json({"ok": False, "error": "Username must be at least 3 characters long."}, 400)
                return
            accounts = load_accounts()
            if any(a.get("slug", "").lower() == slug for a in accounts):
                self.send_json({"ok": False, "error": "Account already exists."}, 400)
                return

            d_name = data.get("displayName") or " ".join(filter(None, [data.get("firstName"), data.get("lastName")])) or slug
            pw_hash = hash_password(data.get("password", "password123"), slug)
            new_acc = {
                "name": d_name,
                "firstName": data.get("firstName", ""),
                "lastName": data.get("lastName", ""),
                "showRealName": data.get("showRealName") is not False,
                "username": slug,
                "slug": slug,
                "passwordHashes": [pw_hash],
                "team": "N",
                "badge": "Standard Member",
                "badgeClass": "badge-member",
                "hasTysonBadge": False,
                "role": "Registered Member",
                "division": "Community Member",
                "bio": data.get("bio") or f"myTYSON profile for {d_name}.",
                "isDynamic": True
            }
            accounts.append(new_acc)
            save_accounts(accounts)

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
            self.send_json({"ok": True, "account": sanitize_account(new_acc, True), "session": issue_session(new_acc)})
            return

        if parsed.path == "/api/auth/google":
            mode = (data.get("mode") or "signin").lower()
            accounts = load_accounts()

            if mode == "unlink":
                slug = (data.get("slug") or "").lower().replace("@tysonmediagroup.org", "").strip()
                target = next((a for a in accounts if a.get("slug", "").lower() == slug), None)
                if not target:
                    self.send_json({"ok": False, "error": "Account not found."}, 404)
                    return
                target["googleSub"] = None
                target["googleEmail"] = None
                save_accounts(accounts)
                self.send_json({"ok": True, "status": "UNLINKED", "account": sanitize_account(target, True), "session": issue_session(target)})
                return

            if mode == "complete":
                token = data.get("onboardingToken") or {}
                payload_obj = token.get("payload")
                sig = token.get("sig")
                if not verify_payload(payload_obj, sig):
                    self.send_json({"ok": False, "error": "Invalid or expired Google onboarding session."}, 400)
                    return
                slug = (data.get("slug") or "").lower().replace("@tysonmediagroup.org", "").strip()
                if len(slug) < 3:
                    self.send_json({"ok": False, "error": "Username must be at least 3 characters long."}, 400)
                    return
                if any(a.get("slug", "").lower() == slug for a in accounts):
                    self.send_json({"ok": False, "error": f'Username "{slug}" is already taken.'}, 400)
                    return
                f_name = (data.get("firstName") or payload_obj.get("firstName") or "").strip()
                l_name = (data.get("lastName") or payload_obj.get("lastName") or "").strip()
                d_name = " ".join(filter(None, [f_name, l_name])) or payload_obj.get("name") or slug
                new_acc = {
                    "name": d_name,
                    "firstName": f_name,
                    "lastName": l_name,
                    "showRealName": data.get("showRealName") is not False,
                    "username": slug,
                    "slug": slug,
                    "passwordHashes": [],
                    "team": "N",
                    "badge": "Standard Member",
                    "badgeClass": "badge-member",
                    "hasTysonBadge": False,
                    "role": "Registered Member",
                    "division": "Community Member",
                    "bio": f"myTYSON profile for {d_name}.",
                    "pfpUrl": payload_obj.get("picture") or "",
                    "googleSub": payload_obj.get("sub"),
                    "googleEmail": payload_obj.get("email"),
                    "isDynamic": True
                }
                accounts.append(new_acc)
                save_accounts(accounts)
                profiles = load_profiles()
                profiles[slug] = {
                    "displayName": d_name,
                    "firstName": f_name,
                    "lastName": l_name,
                    "showRealName": new_acc["showRealName"],
                    "bio": new_acc["bio"],
                    "division": new_acc["division"],
                    "pfpUrl": new_acc["pfpUrl"]
                }
                save_profiles(profiles)
                self.send_json({"ok": True, "status": "AUTHENTICATED", "account": sanitize_account(new_acc, True), "session": issue_session(new_acc)})
                return

            try:
                g_user = verify_google_token(data.get("credential"), data.get("accessToken"))
            except Exception as e:
                self.send_json({"ok": False, "error": str(e)}, 400)
                return

            if mode == "link":
                slug = (data.get("slug") or "").lower().replace("@tysonmediagroup.org", "").strip()
                target = next((a for a in accounts if a.get("slug", "").lower() == slug), None)
                if not target:
                    target = {"slug": slug, "username": slug, "name": slug, "team": "N", "isDynamic": True}
                    accounts.append(target)
                target["googleSub"] = g_user["sub"]
                target["googleEmail"] = g_user["email"]
                if not target.get("pfpUrl") and g_user.get("picture"):
                    target["pfpUrl"] = g_user["picture"]
                save_accounts(accounts)
                self.send_json({"ok": True, "status": "LINKED", "account": sanitize_account(target, True), "session": issue_session(target)})
                return

            existing = next((a for a in accounts if a.get("googleSub") == g_user["sub"] or (a.get("googleEmail") or "").lower() == g_user["email"]), None)
            if existing:
                self.send_json({"ok": True, "status": "AUTHENTICATED", "account": sanitize_account(existing, True), "session": issue_session(existing)})
                return

            onboarding_token = sign_payload({
                "sub": g_user["sub"],
                "email": g_user["email"],
                "name": g_user["name"],
                "firstName": g_user["firstName"],
                "lastName": g_user["lastName"],
                "picture": g_user["picture"],
                "suggestedSlug": g_user["suggestedSlug"],
                "iat": int(time.time() * 1000)
            })
            self.send_json({
                "ok": True,
                "status": "NEEDS_HANDLE",
                "onboardingToken": onboarding_token,
                "googleProfile": g_user
            })
            return

        if parsed.path == "/api/profile":
            qs = urllib.parse.parse_qs(parsed.query)
            slug = (qs.get("slug", [""])[0]).lower().replace("@tysonmediagroup.org", "")
            if slug:
                profiles = load_profiles()
                profiles[slug] = data
                save_profiles(profiles)
            self.send_json({"ok": True, "profile": data})
            return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/accounts":
            qs = urllib.parse.parse_qs(parsed.query)
            slug = (qs.get("slug", [""])[0]).lower().replace("@tysonmediagroup.org", "")
            if slug in ["tyson", "t", "ash", "a"]:
                self.send_json({"ok": False, "error": "Cannot delete protected admin account"}, 403)
                return
            accounts = [a for a in load_accounts() if a.get("slug", "").lower() != slug]
            save_accounts(accounts)
            profiles = load_profiles()
            if slug in profiles:
                del profiles[slug]
                save_profiles(profiles)
            self.send_json({"ok": True})
            return
        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("", PORT), MyTysonHandler)
    print(f"Serving myTYSON dashboard with D1-compatible Auth & Google SSO API on http://localhost:{PORT}")
    server.serve_forever()
