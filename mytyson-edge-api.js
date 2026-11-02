// Unified Cloudflare Edge Auth, D1 Storage & Google SSO Engine for myTYSON
// Shared by Cloudflare Pages Functions (functions/api/*) and Cloudflare Worker (worker.js)

const MEMORY_PROFILES = new Map();
const MEMORY_ACCOUNTS = new Map();
let D1_INITIALIZED = false;

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate"
};

// Default seeded accounts (passwords stored strictly as salted SHA-256 hashes, never plaintext)
export const SEED_ACCOUNTS = [
  {
    name: "Stephen French",
    username: "flame@tysonmediagroup.org",
    slug: "flame",
    aliases: ["flame@tysonmediagroup.org", "flame"],
    passwordHashes: ["b5721c15816b6a87b238a2565d38772814857d050a262d0186680214b3c773c5"],
    team: "Y",
    badge: "TYSON Team",
    badgeClass: "badge-team",
    hasTysonBadge: true,
    initials: "SF",
    avatarBg: "linear-gradient(135deg, #991b1b 0%, #450a0a 100%)",
    coverBg: "linear-gradient(125deg, #1a0505 0%, #3b0a0a 45%, #09090b 100%)",
    defaultCoverUrl: "/assets/tyson-t5s-login-backdrop.jpg",
    role: "TYSON Team Member",
    division: "TYSON Atlantis / Creative Direction",
    bio: "Official myTYSON profile for Stephen French."
  },
  {
    name: "Tyler Custine",
    username: "t@tysonmediagroup.org",
    slug: "t",
    aliases: ["t@tysonmediagroup.org", "t", "ty", "ty@tysonmediagroup.org"],
    passwordHashes: ["3745b1327b96c9c6ede767ee79e2b8907c3fdba31fb6c8fb6bb8e76cb0525f92"],
    team: "Y",
    badge: "TYSON Team",
    badgeClass: "badge-team",
    hasTysonBadge: true,
    initials: "TC",
    avatarBg: "linear-gradient(135deg, #b91c1c 0%, #111827 100%)",
    coverBg: "linear-gradient(125deg, #2a0808 0%, #111827 55%, #09090b 100%)",
    defaultCoverUrl: "/assets/atlantis-sunset.jpg",
    role: "Founder & Executive Lead",
    division: "TYSON Media Group / Core Systems",
    bio: "Official myTYSON profile for Tyler Custine.",
    isPowerAdmin: true
  },
  {
    name: "TYSON Media Group",
    username: "tyson@tysonmediagroup.org",
    loginId: "tyson",
    slug: "tyson",
    aliases: ["tyson", "tyson@tysonmediagroup.org"],
    passwordHashes: ["b6cbc904b5abaf19a634bd6acc4ed9093f8034366a04f8356c0f60ff3cbd966d"],
    team: "Y",
    badge: "Official TYSON Account",
    badgeClass: "badge-official",
    hasTysonBadge: true,
    initials: "TMG",
    avatarBg: "linear-gradient(135deg, #d97706 0%, #451a03 100%)",
    coverBg: "linear-gradient(125deg, #2e1905 0%, #18181b 55%, #09090b 100%)",
    defaultCoverUrl: "/assets/tyson-t5s-login-backdrop.jpg",
    role: "Primary Organization Account",
    division: "TYSON Media Group",
    bio: "Official organization profile for TYSON Media Group.",
    isPowerAdmin: true
  },
  {
    name: "Ash French",
    username: "a@tysonmediagroup.org",
    slug: "a",
    aliases: ["a@tysonmediagroup.org", "a", "ash", "ash@tysonmediagroup.org", "ashfrench"],
    passwordHashes: ["7f33322277113c6591fa920fa06c0f5a3c4e4a33715aa0c9fd24c6251f591d19"],
    team: "Y",
    badge: "TYSON Team",
    badgeClass: "badge-team",
    hasTysonBadge: true,
    initials: "AF",
    avatarBg: "linear-gradient(135deg, #7f1d1d 0%, #1e1b4b 100%)",
    coverBg: "linear-gradient(125deg, #1f091d 0%, #111827 55%, #09090b 100%)",
    defaultCoverUrl: "/assets/photograph.jpg",
    role: "TYSON Team Member",
    division: "TYSON Media Group",
    bio: "Official myTYSON profile for Ash French.",
    isPowerAdmin: true
  },
  {
    name: "Triston Rinebarger",
    username: "rpm@tysonmediagroup.org",
    slug: "rpm",
    aliases: ["rpm@tysonmediagroup.org", "rpm"],
    passwordHashes: [
      "c3490c62ef1680ccd128e0d57655b85fbb33683ee91f5f4dc3d5ef6a9bb78c17",
      "4f54664f678ba0d7b2069f8853b1998e5c23789fd5d34102f65872935a65cdb3"
    ],
    team: "Y",
    badge: "TYSON Team",
    badgeClass: "badge-team",
    hasTysonBadge: true,
    initials: "TR",
    avatarBg: "linear-gradient(135deg, #991b1b 0%, #1f2937 100%)",
    coverBg: "linear-gradient(125deg, #260b0b 0%, #18181b 55%, #09090b 100%)",
    defaultCoverUrl: "/assets/atlantisplayer_nightgasstation1.jpg",
    role: "TYSON Team Member",
    division: "TYSON RPM / Operations",
    bio: "Official myTYSON profile for Triston Rinebarger."
  },
  {
    name: "TYSON Support",
    username: "contact@tysonmediagroup.org",
    slug: "contact",
    aliases: ["contact@tysonmediagroup.org", "contact"],
    passwordHashes: ["5b9b9f6cc4a8e3a8168525e5d875cbeeb66be6a21ac823e459257058887a217c"],
    team: "Y",
    badge: "Official Support Account",
    badgeClass: "badge-support",
    hasTysonBadge: true,
    initials: "TS",
    avatarBg: "linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)",
    coverBg: "linear-gradient(125deg, #082032 0%, #111827 55%, #09090b 100%)",
    defaultCoverUrl: "/assets/tyson-t5s-login-backdrop.jpg",
    role: "Official Support Channel",
    division: "TYSON Support & Communications",
    bio: "Official myTYSON support and contact account."
  },
  {
    name: "Jake Gantt",
    username: "j.gantt",
    slug: "j.gantt",
    aliases: ["j.gantt"],
    passwordHashes: ["a4428c9f3b6e73d8f9c2244c510cb1c88ec314bcbbecacf2580d538791cfa0b7"],
    team: "N",
    badge: "Standard Member",
    badgeClass: "badge-member",
    hasTysonBadge: false,
    initials: "JG",
    avatarBg: "linear-gradient(135deg, #27272a 0%, #09090b 100%)",
    coverBg: "linear-gradient(125deg, #18181b 0%, #09090b 65%, #050505 100%)",
    defaultCoverUrl: "",
    role: "Registered Member",
    division: "Independent / External",
    bio: "Registered myTYSON account for Jake Gantt."
  },
  {
    name: "Eythn Cullia",
    firstName: "",
    lastName: "",
    showRealName: false,
    username: "eythn@tysonmediagroup.org",
    slug: "eythn",
    aliases: ["eythn@tysonmediagroup.org", "eythn"],
    passwordHashes: ["020eb6fb068b8c6400bb2a26428cc67157e7f32c5d985cad45513a5ab984d175"],
    team: "Y",
    badge: "TYSON Team",
    badgeClass: "badge-team",
    hasTysonBadge: true,
    initials: "EC",
    avatarBg: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
    coverBg: "linear-gradient(125deg, #18181b 0%, #09090b 65%, #050505 100%)",
    defaultCoverUrl: "",
    role: "Marketing Coordinator",
    division: "TYSON Media Group",
    bio: "myTYSON profile for Eythn Cullia."
  },
  {
    name: "Jason May",
    firstName: "Jason",
    lastName: "May",
    showRealName: true,
    username: "jmay",
    slug: "jmay",
    aliases: ["jmay", "jmay@tysonmediagroup.org"],
    passwordHashes: ["93ac3fb9fab415b2a9e437e0816115b579efebe39259bf86118558538fb52fda"],
    team: "N",
    badge: "Standard Member",
    badgeClass: "badge-member",
    hasTysonBadge: false,
    initials: "JM",
    avatarBg: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
    coverBg: "linear-gradient(125deg, #18181b 0%, #09090b 65%, #050505 100%)",
    defaultCoverUrl: "",
    role: "Registered Member",
    division: "TYSON Media Group",
    bio: "myTYSON profile for Jason May."
  }
];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

// --- WebCrypto Password Hashing & HMAC Session Signing ---

export async function hashPassword(password, slug) {
  const cleanSlug = (slug || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
  const input = `mytyson_salt_v1:${cleanSlug}:${(password || "").trim()}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyAccountPassword(account, password) {
  if (!account || !password) return false;
  const pass = (password || "").trim();
  const slug = (account.slug || "").toLowerCase();
  const candidateHash = await hashPassword(pass, slug);

  if (Array.isArray(account.passwordHashes) && account.passwordHashes.includes(candidateHash)) {
    return true;
  }
  if (account.passwordHash && account.passwordHash === candidateHash) {
    return true;
  }
  // Legacy plaintext migration support for any pre-existing custom accounts in cache
  if (account.password && account.password === pass) {
    return true;
  }
  if (Array.isArray(account.altPasswords) && account.altPasswords.includes(pass)) {
    return true;
  }
  return false;
}

function getSecretKeyMaterial(env) {
  const rawSecret = (env && (env.SESSION_SECRET || env.MYTYSON_SECRET)) || "mytyson-edge-hmac-default-key-2026-tmg";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(rawSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signPayloadHmac(payloadObj, env) {
  const key = await getSecretKeyMaterial(env);
  const canonical = JSON.stringify(payloadObj);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical));
  const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  return { payload: payloadObj, sig: sigHex };
}

export async function verifyPayloadHmac(payloadObj, sigHex, env) {
  if (!payloadObj || !sigHex) return false;
  try {
    const key = await getSecretKeyMaterial(env);
    const canonical = JSON.stringify(payloadObj);
    const expectedBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical));
    const expectedHex = Array.from(new Uint8Array(expectedBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    return expectedHex === sigHex;
  } catch (e) {
    return false;
  }
}

export async function issueSessionForAccount(acc, env) {
  const isStaff = isStaffTeam(acc.team);
  const cleanSlug = (acc.slug || "").toLowerCase();
  const formattedUsername = isStaff ? `${cleanSlug}@tysonmediagroup.org` : cleanSlug;
  const coreSession = {
    name: acc.name || cleanSlug,
    username: formattedUsername,
    slug: cleanSlug,
    team: isStaff ? "Y" : "N",
    badge: acc.badge || (isStaff ? "TYSON Team" : "Standard Member"),
    hasTysonBadge: acc.hasTysonBadge !== undefined ? !!acc.hasTysonBadge : isStaff,
    googleLinked: !!(acc.googleSub || acc.googleEmail),
    googleEmail: acc.googleEmail || "",
    ts: Date.now()
  };
  const { sig } = await signPayloadHmac(coreSession, env);
  return { ...coreSession, sig };
}

export async function verifyRequestSession(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  let rawToken = "";
  if (authHeader.startsWith("Bearer ")) {
    rawToken = authHeader.slice(7).trim();
  }
  if (!rawToken) return null;
  try {
    const decoded = JSON.parse(atob(rawToken));
    if (!decoded || !decoded.slug || !decoded.sig) return null;
    const { sig, ...coreSession } = decoded;
    const valid = await verifyPayloadHmac(coreSession, sig, env);
    return valid ? coreSession : null;
  } catch (e) {
    return null;
  }
}

export function isStaffTeam(teamVal) {
  return teamVal === "Y" || teamVal === true || teamVal === "Official TYSON Account" || teamVal === "Official Support Account";
}

export function isProtectedAdminSlug(slug) {
  const s = (slug || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
  return s === "tyson" || s === "t" || s === "ash" || s === "a";
}

// Strip password hashes & sensitive fields before sending to public clients
export function sanitizeAccount(acc, includePrivateEmail = false) {
  if (!acc) return null;
  const isStaff = isStaffTeam(acc.team);
  const cleanSlug = (acc.slug || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
  // Enforce rule: only TYSON staff get @tysonmediagroup.org usernames!
  const canonicalUsername = isStaff ? `${cleanSlug}@tysonmediagroup.org` : cleanSlug;

  const copy = Object.assign({}, acc, {
    slug: cleanSlug,
    username: canonicalUsername,
    team: isStaff ? "Y" : "N",
    googleLinked: !!(acc.googleSub || acc.googleEmail)
  });

  delete copy.password;
  delete copy.altPasswords;
  delete copy.passwordHash;
  delete copy.passwordHashes;
  delete copy.googleSub;
  if (!includePrivateEmail) {
    delete copy.googleEmail;
  }
  return copy;
}

// --- Cloudflare D1 + KV + Edge Cache Unified Storage Layer ---

function getD1(env) {
  return (env && (env.DB || env.MYTYSON_DB || env.mytyson_db)) || null;
}

async function ensureD1Tables(env) {
  const db = getD1(env);
  if (!db || D1_INITIALIZED) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS mytyson_accounts (
        slug TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT NOT NULL,
        first_name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        show_real_name INTEGER DEFAULT 1,
        password_hashes TEXT DEFAULT '[]',
        team TEXT DEFAULT 'N',
        badge TEXT DEFAULT 'Standard Member',
        badge_class TEXT DEFAULT 'badge-member',
        has_tyson_badge INTEGER DEFAULT 0,
        role TEXT DEFAULT 'Registered Member',
        division TEXT DEFAULT 'TYSON Media Group',
        bio TEXT DEFAULT '',
        pfp_url TEXT DEFAULT '',
        google_sub TEXT DEFAULT NULL,
        google_email TEXT DEFAULT NULL,
        is_power_admin INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS mytyson_profiles (
        slug TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();

    D1_INITIALIZED = true;
  } catch (e) {
    // Fallback gracefully if D1 table creation fails
  }
}

function accountsCacheKey() {
  return new Request("https://my.tysonmediagroup.org/_internal_edge_accounts_v2", { method: "GET" });
}

function profileCacheKey(slug) {
  return new Request(`https://my.tysonmediagroup.org/_internal_edge_profile_v1/${encodeURIComponent(slug)}`, { method: "GET" });
}

export async function readAllAccountsInternal(env) {
  const map = new Map();
  for (const seed of SEED_ACCOUNTS) {
    map.set(seed.slug.toLowerCase(), Object.assign({}, seed));
  }

  // 1. Check D1 if bound
  const db = getD1(env);
  if (db) {
    await ensureD1Tables(env);
    try {
      const { results } = await db.prepare("SELECT slug, data_json, google_sub, google_email, password_hashes FROM mytyson_accounts").all();
      if (Array.isArray(results)) {
        for (const row of results) {
          try {
            const parsed = JSON.parse(row.data_json || "{}");
            const slug = (row.slug || parsed.slug || "").toLowerCase();
            if (slug) {
              const existing = map.get(slug) || {};
              const hashes = row.password_hashes ? JSON.parse(row.password_hashes) : (parsed.passwordHashes || existing.passwordHashes || []);
              map.set(slug, Object.assign({}, existing, parsed, {
                slug,
                passwordHashes: hashes,
                googleSub: row.google_sub || parsed.googleSub || existing.googleSub || null,
                googleEmail: row.google_email || parsed.googleEmail || existing.googleEmail || null
              }));
            }
          } catch (e) {}
        }
        return Array.from(map.values());
      }
    } catch (e) {}
  }

  // 2. Check KV if bound
  if (env && env.MYTYSON_KV) {
    try {
      const kvVal = await env.MYTYSON_KV.get("system:accounts");
      if (kvVal) {
        const list = JSON.parse(kvVal);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.slug) {
              const k = item.slug.toLowerCase();
              map.set(k, Object.assign({}, map.get(k) || {}, item));
            }
          }
          return Array.from(map.values());
        }
      }
    } catch (e) {}
  }

  // 3. Check Cloudflare Edge Cache
  try {
    const cache = caches.default;
    const cachedResp = await cache.match(accountsCacheKey());
    if (cachedResp) {
      const list = await cachedResp.json();
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.slug) {
            const k = item.slug.toLowerCase();
            map.set(k, Object.assign({}, map.get(k) || {}, item));
          }
        }
      }
    }
  } catch (e) {}

  // 4. Merge in-memory isolate state
  for (const [k, v] of MEMORY_ACCOUNTS.entries()) {
    map.set(k, Object.assign({}, map.get(k) || {}, v));
  }

  return Array.from(map.values());
}

export async function saveAccountInternal(account, env, waitUntil) {
  const cleanSlug = (account.slug || account.username || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
  if (!cleanSlug) return null;

  const isStaff = isStaffTeam(account.team);
  const canonicalUsername = isStaff ? `${cleanSlug}@tysonmediagroup.org` : cleanSlug;

  // Hash plaintext password if provided
  let passwordHashes = Array.isArray(account.passwordHashes) ? [...account.passwordHashes] : [];
  if (account.password) {
    const h = await hashPassword(account.password, cleanSlug);
    if (!passwordHashes.includes(h)) passwordHashes.unshift(h);
  }

  const now = Date.now();
  const record = Object.assign({}, account, {
    slug: cleanSlug,
    username: canonicalUsername,
    team: isStaff ? "Y" : "N",
    passwordHashes,
    updatedAt: now,
    createdAt: account.createdAt || now
  });
  delete record.password;
  delete record.altPasswords;

  MEMORY_ACCOUNTS.set(cleanSlug, record);

  // 1. Write to D1 if bound
  const db = getD1(env);
  if (db) {
    await ensureD1Tables(env);
    try {
      await db.prepare(`
        INSERT INTO mytyson_accounts (
          slug, username, name, first_name, last_name, show_real_name,
          password_hashes, team, badge, badge_class, has_tyson_badge,
          role, division, bio, pfp_url, google_sub, google_email,
          is_power_admin, data_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          username = excluded.username,
          name = excluded.name,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          show_real_name = excluded.show_real_name,
          password_hashes = excluded.password_hashes,
          team = excluded.team,
          badge = excluded.badge,
          badge_class = excluded.badge_class,
          has_tyson_badge = excluded.has_tyson_badge,
          role = excluded.role,
          division = excluded.division,
          bio = excluded.bio,
          pfp_url = excluded.pfp_url,
          google_sub = excluded.google_sub,
          google_email = excluded.google_email,
          is_power_admin = excluded.is_power_admin,
          data_json = excluded.data_json,
          updated_at = excluded.updated_at
      `).bind(
        cleanSlug,
        canonicalUsername,
        record.name || cleanSlug,
        record.firstName || "",
        record.lastName || "",
        record.showRealName === false ? 0 : 1,
        JSON.stringify(passwordHashes),
        record.team,
        record.badge || (isStaff ? "TYSON Team" : "Standard Member"),
        record.badgeClass || (isStaff ? "badge-team" : "badge-member"),
        record.hasTysonBadge ? 1 : 0,
        record.role || (isStaff ? "TYSON Team Member" : "Registered Member"),
        record.division || "TYSON Media Group",
        record.bio || "",
        record.pfpUrl || "",
        record.googleSub || null,
        record.googleEmail || null,
        record.isPowerAdmin ? 1 : 0,
        JSON.stringify(record),
        record.createdAt,
        record.updatedAt
      ).run();
    } catch (e) {}
  }

  // 2. Also update KV / Edge Cache for fallback consistency
  const all = await readAllAccountsInternal(env);
  const idx = all.findIndex(a => a.slug && a.slug.toLowerCase() === cleanSlug);
  if (idx >= 0) all[idx] = record;
  else all.push(record);

  const rawAll = JSON.stringify(all);
  if (env && env.MYTYSON_KV) {
    try { await env.MYTYSON_KV.put("system:accounts", rawAll); } catch (e) {}
  }
  try {
    const cache = caches.default;
    const putPromise = cache.put(accountsCacheKey(), new Response(rawAll, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000" }
    }));
    if (waitUntil) waitUntil(putPromise);
    else await putPromise;
  } catch (e) {}

  return record;
}

export async function deleteAccountInternal(slug, env, waitUntil) {
  const cleanSlug = (slug || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
  MEMORY_ACCOUNTS.delete(cleanSlug);

  const db = getD1(env);
  if (db) {
    await ensureD1Tables(env);
    try {
      await db.prepare("DELETE FROM mytyson_accounts WHERE slug = ?").bind(cleanSlug).run();
      await db.prepare("DELETE FROM mytyson_profiles WHERE slug = ?").bind(cleanSlug).run();
    } catch (e) {}
  }

  let all = await readAllAccountsInternal(env);
  all = all.filter(a => a.slug && a.slug.toLowerCase() !== cleanSlug);
  const rawAll = JSON.stringify(all);

  if (env && env.MYTYSON_KV) {
    try { await env.MYTYSON_KV.put("system:accounts", rawAll); } catch (e) {}
  }
  try {
    const cache = caches.default;
    const putPromise = cache.put(accountsCacheKey(), new Response(rawAll, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000" }
    }));
    if (waitUntil) waitUntil(putPromise);
    else await putPromise;
  } catch (e) {}
}

export async function readProfileInternal(slug, env) {
  const cleanSlug = (slug || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
  if (!cleanSlug) return {};

  const db = getD1(env);
  if (db) {
    await ensureD1Tables(env);
    try {
      const row = await db.prepare("SELECT data_json FROM mytyson_profiles WHERE slug = ?").bind(cleanSlug).first();
      if (row && row.data_json) {
        return JSON.parse(row.data_json);
      }
    } catch (e) {}
  }

  if (env && env.MYTYSON_KV) {
    try {
      const kvVal = await env.MYTYSON_KV.get(`profile:${cleanSlug}`);
      if (kvVal) return JSON.parse(kvVal);
    } catch (e) {}
  }

  try {
    const cache = caches.default;
    const cachedResp = await cache.match(profileCacheKey(cleanSlug));
    if (cachedResp) {
      const data = await cachedResp.json();
      MEMORY_PROFILES.set(cleanSlug, data);
      return data;
    }
  } catch (e) {}

  return MEMORY_PROFILES.get(cleanSlug) || {};
}

export async function writeProfileInternal(slug, data, env, waitUntil) {
  const cleanSlug = (slug || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
  if (!cleanSlug) return {};
  const now = Date.now();
  const enriched = Object.assign({ slug: cleanSlug }, data, { slug: cleanSlug, updatedAt: data.updatedAt || now });
  MEMORY_PROFILES.set(cleanSlug, enriched);
  const raw = JSON.stringify(enriched);

  const db = getD1(env);
  if (db) {
    await ensureD1Tables(env);
    try {
      await db.prepare(`
        INSERT INTO mytyson_profiles (slug, data_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          data_json = excluded.data_json,
          updated_at = excluded.updated_at
      `).bind(cleanSlug, raw, enriched.updatedAt).run();
    } catch (e) {}
  }

  if (env && env.MYTYSON_KV) {
    try { await env.MYTYSON_KV.put(`profile:${cleanSlug}`, raw); } catch (e) {}
  }

  try {
    const cache = caches.default;
    const putPromise = cache.put(profileCacheKey(cleanSlug), new Response(raw, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000" }
    }));
    if (waitUntil) waitUntil(putPromise);
    else await putPromise;
  } catch (e) {}

  return enriched;
}

export function findAccountInList(accounts, identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const stripped = clean.replace(/@tysonmediagroup\.org$/i, "");
  for (const acc of accounts) {
    if (acc.slug && acc.slug.toLowerCase() === stripped) return acc;
    if (acc.username && acc.username.toLowerCase() === clean) return acc;
    if (Array.isArray(acc.aliases) && acc.aliases.some(a => (a || "").toLowerCase() === clean)) return acc;
  }
  return null;
}

// --- Google OAuth / ID Token Verification at the Edge ---

async function verifyGoogleTokenAtEdge(credential, accessToken, env) {
  let info = null;
  if (credential) {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!resp.ok) {
      throw new Error("Invalid or expired Google ID token.");
    }
    info = await resp.json();
    const expectedClientId = env && env.GOOGLE_CLIENT_ID;
    if (expectedClientId && info.aud !== expectedClientId) {
      throw new Error("Google token audience mismatch.");
    }
  } else if (accessToken) {
    const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!resp.ok) {
      throw new Error("Invalid or expired Google access token.");
    }
    info = await resp.json();
  } else {
    throw new Error("Missing Google credential or access token.");
  }

  if (!info || !info.sub || !info.email) {
    throw new Error("Google token did not include required account identity.");
  }

  const firstName = info.given_name || (info.name ? info.name.split(" ")[0] : "");
  const lastName = info.family_name || (info.name ? info.name.split(" ").slice(1).join(" ") : "");
  const emailPrefix = (info.email.split("@")[0] || "").toLowerCase().replace(/[^a-z0-9._-]/g, "");
  const suggestedSlug = emailPrefix.length >= 3 ? emailPrefix.slice(0, 24) : `${emailPrefix || "user"}123`;

  return {
    sub: String(info.sub),
    email: String(info.email).toLowerCase(),
    emailVerified: info.email_verified === true || info.email_verified === "true",
    name: info.name || [firstName, lastName].filter(Boolean).join(" ") || suggestedSlug,
    firstName,
    lastName,
    picture: info.picture || "",
    suggestedSlug
  };
}

// --- Main Unified Request Router ---

export async function handleApiRequest(request, env, ctxOrContext) {
  const url = new URL(request.url);
  const waitUntil = ctxOrContext && ctxOrContext.waitUntil ? ctxOrContext.waitUntil.bind(ctxOrContext) : null;

  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // 1. POST /api/auth/login — Password Authentication at Edge
  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = await request.json();
      const identifier = (body.username || body.identifier || body.slug || "").trim();
      const password = body.password || "";
      const accounts = await readAllAccountsInternal(env);
      const matched = findAccountInList(accounts, identifier);
      if (!matched) {
        return jsonResponse({ ok: false, error: "Invalid myTYSON username or password." }, 401);
      }
      const valid = await verifyAccountPassword(matched, password);
      if (!valid) {
        return jsonResponse({ ok: false, error: "Invalid myTYSON username or password." }, 401);
      }
      const session = await issueSessionForAccount(matched, env);
      return jsonResponse({
        ok: true,
        account: sanitizeAccount(matched, true),
        session
      });
    } catch (e) {
      return jsonResponse({ ok: false, error: "Invalid login request." }, 400);
    }
  }

  // 2. POST /api/auth/register — Public Standard Account Registration
  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    try {
      const body = await request.json();
      const slug = (body.slug || body.username || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();

      if (slug.length < 3) {
        return jsonResponse({ ok: false, error: "Username must be at least 3 characters long." }, 400);
      }
      if (!/^[a-z0-9._-]+$/i.test(slug)) {
        return jsonResponse({ ok: false, error: "Username may only contain letters, numbers, periods, and hyphens." }, 400);
      }

      const accounts = await readAllAccountsInternal(env);
      if (findAccountInList(accounts, slug)) {
        return jsonResponse({ ok: false, error: `Username "${slug}" is already taken.` }, 400);
      }

      const firstName = (body.firstName || "").trim();
      const lastName = (body.lastName || "").trim();
      const dName = (body.displayName || body.name || [firstName, lastName].filter(Boolean).join(" ") || slug).trim();
      const initials = ((firstName[0] || "") + (lastName[0] || slug[0] || "")).toUpperCase() || "TM";

      // Non-staff standard members NEVER get @tysonmediagroup.org
      const newAccInput = {
        name: dName,
        firstName,
        lastName,
        showRealName: body.showRealName !== false,
        username: slug,
        slug,
        aliases: [slug],
        password: body.password || "password123",
        team: "N",
        badge: "Standard Member",
        badgeClass: "badge-member",
        hasTysonBadge: false,
        initials,
        role: "Registered Member",
        division: "Community Member",
        bio: body.bio || `myTYSON profile for ${dName}.`,
        isDynamic: true,
        createdAt: Date.now()
      };

      const savedAcc = await saveAccountInternal(newAccInput, env, waitUntil);
      await writeProfileInternal(slug, {
        displayName: dName,
        firstName,
        lastName,
        showRealName: savedAcc.showRealName,
        bio: savedAcc.bio,
        division: savedAcc.division
      }, env, waitUntil);

      const session = await issueSessionForAccount(savedAcc, env);
      return jsonResponse({
        ok: true,
        account: sanitizeAccount(savedAcc, true),
        session
      });
    } catch (e) {
      return jsonResponse({ ok: false, error: "Invalid registration payload." }, 400);
    }
  }

  // 3. GET / POST /api/auth/google — Centralized Google SSO (Sign In, Create Account with Handle Picker, Link/Unlink)
  if (url.pathname === "/api/auth/google") {
    if (request.method === "GET") {
      const clientId = (env && env.GOOGLE_CLIENT_ID) || "";
      return jsonResponse({ ok: true, clientId });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        const mode = (body.mode || "signin").toLowerCase();

        // Mode A: Unlink Google Account (optional linking — user can disconnect anytime)
        if (mode === "unlink") {
          const verifiedSession = await verifyRequestSession(request, env);
          const targetSlug = (verifiedSession && verifiedSession.slug) || (body.slug || "").toLowerCase();
          if (!targetSlug) {
            return jsonResponse({ ok: false, error: "Must be signed in to unlink Google account." }, 401);
          }
          const accounts = await readAllAccountsInternal(env);
          const existing = findAccountInList(accounts, targetSlug);
          if (!existing) {
            return jsonResponse({ ok: false, error: "Account not found." }, 404);
          }
          existing.googleSub = null;
          existing.googleEmail = null;
          const updated = await saveAccountInternal(existing, env, waitUntil);
          const session = await issueSessionForAccount(updated, env);
          return jsonResponse({
            ok: true,
            status: "UNLINKED",
            account: sanitizeAccount(updated, true),
            session
          });
        }

        // Mode B: Complete New Google User Signup after choosing their handle
        if (mode === "complete") {
          const { onboardingToken, slug: rawSlug, firstName, lastName, showRealName, password } = body;
          if (!onboardingToken || ! onboardingToken.payload || !onboardingToken.sig) {
            return jsonResponse({ ok: false, error: "Missing or invalid Google onboarding session." }, 400);
          }
          const validToken = await verifyPayloadHmac(onboardingToken.payload, onboardingToken.sig, env);
          if (!validToken || (Date.now() - (onboardingToken.payload.iat || 0) > 20 * 60 * 1000)) {
            return jsonResponse({ ok: false, error: "Google sign-up session expired. Please click Continue with Google again." }, 401);
          }

          const gProf = onboardingToken.payload;
          const cleanSlug = (rawSlug || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
          if (cleanSlug.length < 3) {
            return jsonResponse({ ok: false, error: "Username must be at least 3 characters long." }, 400);
          }
          if (!/^[a-z0-9._-]+$/i.test(cleanSlug)) {
            return jsonResponse({ ok: false, error: "Username may only contain letters, numbers, periods, and hyphens." }, 400);
          }

          const accounts = await readAllAccountsInternal(env);
          if (findAccountInList(accounts, cleanSlug)) {
            return jsonResponse({ ok: false, error: `Username "${cleanSlug}" is already taken. Please choose another.` }, 400);
          }

          const fName = (firstName !== undefined ? firstName : gProf.firstName || "").trim();
          const lName = (lastName !== undefined ? lastName : gProf.lastName || "").trim();
          const dName = ([fName, lName].filter(Boolean).join(" ") || gProf.name || cleanSlug).trim();
          const initials = ((fName[0] || "") + (lName[0] || cleanSlug[0] || "")).toUpperCase() || "TM";

          const newAccInput = {
            name: dName,
            firstName: fName,
            lastName: lName,
            showRealName: showRealName !== false,
            username: cleanSlug, // Non-staff never get @tysonmediagroup.org
            slug: cleanSlug,
            aliases: [cleanSlug],
            password: password || crypto.randomUUID(),
            team: "N",
            badge: "Standard Member",
            badgeClass: "badge-member",
            hasTysonBadge: false,
            initials,
            role: "Registered Member",
            division: "Community Member",
            bio: `myTYSON profile for ${dName}.`,
            pfpUrl: gProf.picture || "",
            googleSub: gProf.sub,
            googleEmail: gProf.email,
            isDynamic: true,
            createdAt: Date.now()
          };

          const savedAcc = await saveAccountInternal(newAccInput, env, waitUntil);
          await writeProfileInternal(cleanSlug, {
            displayName: dName,
            firstName: fName,
            lastName: lName,
            showRealName: savedAcc.showRealName,
            bio: savedAcc.bio,
            division: savedAcc.division,
            pfpUrl: gProf.picture || ""
          }, env, waitUntil);

          const session = await issueSessionForAccount(savedAcc, env);
          return jsonResponse({
            ok: true,
            status: "AUTHENTICATED",
            account: sanitizeAccount(savedAcc, true),
            session
          });
        }

        // Verify Google token at the edge for "signin" or "link"
        const googleUser = await verifyGoogleTokenAtEdge(body.credential, body.accessToken, env);
        const accounts = await readAllAccountsInternal(env);

        // Mode C: Link Google Account to an existing signed-in myTYSON account (e.g. TYSON Staff)
        if (mode === "link") {
          const verifiedSession = await verifyRequestSession(request, env);
          const targetSlug = (verifiedSession && verifiedSession.slug) || (body.slug || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
          if (!targetSlug) {
            return jsonResponse({ ok: false, error: "Please sign in to your myTYSON account first to link Google." }, 401);
          }
          const conflict = accounts.find(a =>
            a.slug.toLowerCase() !== targetSlug &&
            ((a.googleSub && a.googleSub === googleUser.sub) || (a.googleEmail && a.googleEmail.toLowerCase() === googleUser.email))
          );
          if (conflict) {
            return jsonResponse({ ok: false, error: `This Google account (${googleUser.email}) is already linked to @${conflict.slug}.` }, 400);
          }

          const targetAcc = findAccountInList(accounts, targetSlug);
          if (!targetAcc) {
            return jsonResponse({ ok: false, error: "Target myTYSON account not found." }, 404);
          }

          targetAcc.googleSub = googleUser.sub;
          targetAcc.googleEmail = googleUser.email;
          if (!targetAcc.pfpUrl && googleUser.picture) {
            targetAcc.pfpUrl = googleUser.picture;
          }

          const saved = await saveAccountInternal(targetAcc, env, waitUntil);
          const session = await issueSessionForAccount(saved, env);
          return jsonResponse({
            ok: true,
            status: "LINKED",
            account: sanitizeAccount(saved, true),
            session
          });
        }

        // Mode D: Standard Sign-In / Sign-Up with Google
        let existingAcc = accounts.find(a =>
          (a.googleSub && a.googleSub === googleUser.sub) ||
          (a.googleEmail && a.googleEmail.toLowerCase() === googleUser.email)
        );

        // Also match if their Google email is an official @tysonmediagroup.org staff address
        if (!existingAcc && googleUser.email.endsWith("@tysonmediagroup.org")) {
          existingAcc = findAccountInList(accounts, googleUser.email);
        }

        if (existingAcc) {
          existingAcc.googleSub = googleUser.sub;
          existingAcc.googleEmail = googleUser.email;
          if (!existingAcc.pfpUrl && googleUser.picture) {
            existingAcc.pfpUrl = googleUser.picture;
          }
          const saved = await saveAccountInternal(existingAcc, env, waitUntil);
          const session = await issueSessionForAccount(saved, env);
          return jsonResponse({
            ok: true,
            status: "AUTHENTICATED",
            account: sanitizeAccount(saved, true),
            session
          });
        }

        // Brand-new Google user -> Issue signed onboarding token so they can choose their handle
        let candidateSlug = googleUser.suggestedSlug;
        if (findAccountInList(accounts, candidateSlug)) {
          candidateSlug = `${candidateSlug}${Math.floor(10 + Math.random() * 89)}`;
        }

        const onboardingToken = await signPayloadHmac({
          sub: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          picture: googleUser.picture,
          suggestedSlug: candidateSlug,
          iat: Date.now()
        }, env);

        return jsonResponse({
          ok: true,
          status: "NEEDS_HANDLE",
          onboardingToken,
          googleProfile: {
            email: googleUser.email,
            name: googleUser.name,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            picture: googleUser.picture,
            suggestedSlug: candidateSlug
          }
        });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || "Google authentication failed." }, 400);
      }
    }
  }

  // 4. GET / POST / DELETE /api/accounts — Directory & Admin Account Management
  if (url.pathname === "/api/accounts") {
    if (request.method === "GET" || request.method === "HEAD") {
      const accounts = await readAllAccountsInternal(env);
      if (request.method === "HEAD") {
        return new Response(null, { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
      }
      const sanitized = accounts.map(a => sanitizeAccount(a, false));
      return jsonResponse(sanitized);
    }

    if (request.method === "POST" || request.method === "PUT") {
      try {
        const body = await request.json();
        const slug = (body.slug || body.username || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
        if (!slug) {
          return jsonResponse({ ok: false, error: "Username/slug is required." }, 400);
        }

        if (!body.isPowerAdmin && slug.length < 3 && !isProtectedAdminSlug(slug)) {
          return jsonResponse({ ok: false, error: "Username must be at least 3 characters long." }, 400);
        }

        const accounts = await readAllAccountsInternal(env);
        const existing = findAccountInList(accounts, slug) || {};
        const merged = Object.assign({}, existing, body, { slug, isDynamic: true });
        const saved = await saveAccountInternal(merged, env, waitUntil);

        return jsonResponse({ ok: true, account: sanitizeAccount(saved, true) });
      } catch (e) {
        return jsonResponse({ ok: false, error: "Invalid JSON payload." }, 400);
      }
    }

    if (request.method === "DELETE") {
      const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
      if (isProtectedAdminSlug(slug)) {
        return jsonResponse({ ok: false, error: "Cannot delete protected admin account." }, 403);
      }
      await deleteAccountInternal(slug, env, waitUntil);
      return jsonResponse({ ok: true });
    }
  }

  // 5. GET / POST / DELETE /api/profile — Cloud Profile Customizations
  if (url.pathname === "/api/profile") {
    const slug = (url.searchParams.get("slug") || "").trim().toLowerCase().replace(/@tysonmediagroup\.org$/i, "");
    if (!slug) {
      return jsonResponse({ ok: false, error: "Missing slug" }, 400);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const profile = await readProfileInternal(slug, env);
      if (request.method === "HEAD") {
        return new Response(null, { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
      }
      return jsonResponse(profile || {});
    }

    if (request.method === "POST" || request.method === "PUT") {
      try {
        const body = await request.json();
        const saved = await writeProfileInternal(slug, body, env, waitUntil);
        return jsonResponse({ ok: true, profile: saved });
      } catch (err) {
        return jsonResponse({ ok: false, error: "Invalid JSON" }, 400);
      }
    }

    if (request.method === "DELETE") {
      await writeProfileInternal(slug, {}, env, waitUntil);
      return jsonResponse({ ok: true });
    }
  }

  return null;
}
