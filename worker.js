// Cloudflare Worker for my.tysonmediagroup.org
// Provides persistent edge cloud storage for myTYSON profiles (/api/profile) + serves static assets

const MEMORY_PROFILES = new Map();
const MEMORY_ACCOUNTS = new Map();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate"
};

function accountsCacheKey() {
  return new Request("https://my.tysonmediagroup.org/_internal_edge_accounts_v1", { method: "GET" });
}

async function readAccounts(env) {
  if (env && env.MYTYSON_KV) {
    try {
      const kvVal = await env.MYTYSON_KV.get("system:accounts");
      if (kvVal) return JSON.parse(kvVal);
    } catch (e) {}
  }
  try {
    const cache = caches.default;
    const cachedResp = await cache.match(accountsCacheKey());
    if (cachedResp) {
      const data = await cachedResp.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {}
  return Array.from(MEMORY_ACCOUNTS.values());
}

async function writeAccounts(accounts, env, ctx) {
  for (const acc of accounts) {
    if (acc && acc.slug) MEMORY_ACCOUNTS.set(acc.slug.toLowerCase(), acc);
  }
  const raw = JSON.stringify(accounts);
  if (env && env.MYTYSON_KV) {
    try {
      await env.MYTYSON_KV.put("system:accounts", raw);
    } catch (e) {}
  }
  try {
    const cache = caches.default;
    const responseToCache = new Response(raw, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000" }
    });
    const putPromise = cache.put(accountsCacheKey(), responseToCache);
    if (ctx && ctx.waitUntil) ctx.waitUntil(putPromise);
    else await putPromise;
  } catch (e) {}
  return accounts;
}

function cacheKeyForSlug(slug) {
  return new Request(`https://my.tysonmediagroup.org/_internal_edge_profile_v1/${encodeURIComponent(slug)}`, {
    method: "GET"
  });
}

async function readProfile(slug, env) {
  if (!slug) return {};
  // 1. Check KV if bound
  if (env && env.MYTYSON_KV) {
    try {
      const kvVal = await env.MYTYSON_KV.get(`profile:${slug}`);
      if (kvVal) return JSON.parse(kvVal);
    } catch (e) {}
  }
  // 2. Check Cloudflare Edge Cache (persists across Worker invocations at the edge)
  try {
    const cache = caches.default;
    const cachedResp = await cache.match(cacheKeyForSlug(slug));
    if (cachedResp) {
      const data = await cachedResp.json();
      MEMORY_PROFILES.set(slug, data);
      return data;
    }
  } catch (e) {}
  // 3. Fallback to isolate memory
  if (MEMORY_PROFILES.has(slug)) {
    return MEMORY_PROFILES.get(slug);
  }
  return {};
}

async function writeProfile(slug, data, env, ctx) {
  if (!slug) return {};
  const enriched = Object.assign({ slug: slug }, data, { updatedAt: data.updatedAt || Date.now() });
  MEMORY_PROFILES.set(slug, enriched);
  const raw = JSON.stringify(enriched);

  // 1. Save to KV if bound
  if (env && env.MYTYSON_KV) {
    try {
      await env.MYTYSON_KV.put(`profile:${slug}`, raw);
    } catch (e) {}
  }

  // 2. Save to Cloudflare Edge Cache for 1 year
  try {
    const cache = caches.default;
    const responseToCache = new Response(raw, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=31536000"
      }
    });
    const putPromise = cache.put(cacheKeyForSlug(slug), responseToCache);
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(putPromise);
    } else {
      await putPromise;
    }
  } catch (e) {}

  return enriched;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Accounts API: /api/accounts
    if (url.pathname === "/api/accounts") {
      if (request.method === "GET" || request.method === "HEAD") {
        const accounts = await readAccounts(env);
        if (request.method === "HEAD") {
          return new Response(null, { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify(accounts || []), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const slug = (body.slug || body.username || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
          if (!slug) {
            return new Response(JSON.stringify({ ok: false, error: "Username/slug is required" }), {
              status: 400,
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
          }

          // Rule: basic user accounts must NOT have username < 3 characters
          if (!body.isPowerAdmin && slug.length < 3) {
            return new Response(JSON.stringify({ ok: false, error: "Username must be at least 3 characters long." }), {
              status: 400,
              headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
            });
          }

          const accounts = await readAccounts(env);
          const idx = accounts.findIndex(a => a.slug && a.slug.toLowerCase() === slug);
          const enriched = Object.assign({ slug, isDynamic: true, updatedAt: Date.now() }, body, { slug });
          if (idx >= 0) {
            accounts[idx] = Object.assign({}, accounts[idx], enriched);
          } else {
            accounts.push(enriched);
          }
          await writeAccounts(accounts, env, ctx);
          return new Response(JSON.stringify({ ok: true, account: enriched }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }
      }

      if (request.method === "DELETE") {
        const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
        if (slug === "tyson" || slug === "t") {
          return new Response(JSON.stringify({ ok: false, error: "Cannot delete root admin account" }), {
            status: 403,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }
        let accounts = await readAccounts(env);
        accounts = accounts.filter(a => a.slug && a.slug.toLowerCase() !== slug);
        MEMORY_ACCOUNTS.delete(slug);
        await writeAccounts(accounts, env, ctx);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }
    }

    // Public Registration API: /api/auth/register
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const body = await request.json();
        const slug = (body.slug || body.username || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
        if (slug.length < 3) {
          return new Response(JSON.stringify({ ok: false, error: "Username must be at least 3 characters long." }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }
        if (!/^[a-z0-9._-]+$/i.test(slug)) {
          return new Response(JSON.stringify({ ok: false, error: "Username may only contain letters, numbers, periods, and hyphens." }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }

        const accounts = await readAccounts(env);
        if (accounts.some(a => a.slug && a.slug.toLowerCase() === slug)) {
          return new Response(JSON.stringify({ ok: false, error: "Account already exists." }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }

        const dName = body.displayName || [body.firstName, body.lastName].filter(Boolean).join(" ") || slug;
        const newAcc = {
          name: dName,
          firstName: body.firstName || "",
          lastName: body.lastName || "",
          showRealName: body.showRealName !== false,
          username: slug + "@tysonmediagroup.org",
          slug: slug,
          password: body.password || "password123",
          team: "N",
          badge: "Standard Member",
          badgeClass: "badge-member",
          hasTysonBadge: false,
          role: "Registered Member",
          division: "TYSON Media Group",
          bio: body.bio || ("Official myTYSON profile for " + dName + "."),
          isDynamic: true,
          createdAt: Date.now()
        };

        accounts.push(newAcc);
        await writeAccounts(accounts, env, ctx);

        // Also provision initial profile
        await writeProfile(slug, {
          displayName: dName,
          firstName: newAcc.firstName,
          lastName: newAcc.lastName,
          showRealName: newAcc.showRealName,
          bio: newAcc.bio,
          division: newAcc.division
        }, env, ctx);

        return new Response(JSON.stringify({ ok: true, account: newAcc }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid registration payload" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }
    }

    // Cloud Profile API: /api/profile?slug=<slug>
    if (url.pathname === "/api/profile") {
      const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
      if (!slug) {
        return new Response(JSON.stringify({ ok: false, error: "Missing slug" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      if (request.method === "GET" || request.method === "HEAD") {
        const profile = await readProfile(slug, env);
        if (request.method === "HEAD") {
          return new Response(null, {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify(profile || {}), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      if (request.method === "POST" || request.method === "PUT") {
        try {
          const body = await request.json();
          const saved = await writeProfile(slug, body, env, ctx);
          return new Response(JSON.stringify({ ok: true, profile: saved }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
          });
        }
      }

      if (request.method === "DELETE") {
        await writeProfile(slug, {}, env, ctx);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }
    }

    // Serve static assets
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not Found", { status: 404 });
  }
};
