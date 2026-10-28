// Cloudflare Pages Function for /api/accounts

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

async function writeAccounts(accounts, env, waitUntil) {
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
    if (waitUntil) waitUntil(putPromise);
    else await putPromise;
  } catch (e) {}
  return accounts;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestHead() {
  return new Response(null, { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

export async function onRequestGet(context) {
  const accounts = await readAccounts(context.env);
  return new Response(JSON.stringify(accounts || []), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const slug = (body.slug || body.username || "").toLowerCase().replace(/@tysonmediagroup\.org$/i, "").trim();
    if (!slug) {
      return new Response(JSON.stringify({ ok: false, error: "Username/slug is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    if (!body.isPowerAdmin && slug.length < 3) {
      return new Response(JSON.stringify({ ok: false, error: "Username must be at least 3 characters long." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    const accounts = await readAccounts(context.env);
    const idx = accounts.findIndex(a => a.slug && a.slug.toLowerCase() === slug);
    const enriched = Object.assign({ slug, isDynamic: true, updatedAt: Date.now() }, body, { slug });
    if (idx >= 0) {
      accounts[idx] = Object.assign({}, accounts[idx], enriched);
    } else {
      accounts.push(enriched);
    }
    const waitUntil = context.waitUntil ? context.waitUntil.bind(context) : null;
    await writeAccounts(accounts, context.env, waitUntil);
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

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  if (slug === "tyson" || slug === "t") {
    return new Response(JSON.stringify({ ok: false, error: "Cannot delete root admin account" }), {
      status: 403,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
  let accounts = await readAccounts(context.env);
  accounts = accounts.filter(a => a.slug && a.slug.toLowerCase() !== slug);
  MEMORY_ACCOUNTS.delete(slug);
  const waitUntil = context.waitUntil ? context.waitUntil.bind(context) : null;
  await writeAccounts(accounts, context.env, waitUntil);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}
