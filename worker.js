// Cloudflare Worker for my.tysonmediagroup.org
// Provides persistent edge cloud storage for myTYSON profiles (/api/profile) + serves static assets

const MEMORY_PROFILES = new Map();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate"
};

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
