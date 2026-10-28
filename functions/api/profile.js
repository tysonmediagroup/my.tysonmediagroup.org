// Cloudflare Pages Function for /api/profile
// Fully unified with worker.js for edge cloud profile persistence

const MEMORY_PROFILES = new Map();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
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
  if (env && env.MYTYSON_KV) {
    try {
      const kvVal = await env.MYTYSON_KV.get(`profile:${slug}`);
      if (kvVal) return JSON.parse(kvVal);
    } catch (e) {}
  }
  try {
    const cache = caches.default;
    const cachedResp = await cache.match(cacheKeyForSlug(slug));
    if (cachedResp) {
      const data = await cachedResp.json();
      MEMORY_PROFILES.set(slug, data);
      return data;
    }
  } catch (e) {}
  if (MEMORY_PROFILES.has(slug)) {
    return MEMORY_PROFILES.get(slug);
  }
  return {};
}

async function writeProfile(slug, data, env, waitUntil) {
  if (!slug) return {};
  const enriched = Object.assign({ slug: slug }, data, { updatedAt: data.updatedAt || Date.now() });
  MEMORY_PROFILES.set(slug, enriched);
  const raw = JSON.stringify(enriched);

  if (env && env.MYTYSON_KV) {
    try {
      await env.MYTYSON_KV.put(`profile:${slug}`, raw);
    } catch (e) {}
  }

  try {
    const cache = caches.default;
    const responseToCache = new Response(raw, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=31536000"
      }
    });
    const putPromise = cache.put(cacheKeyForSlug(slug), responseToCache);
    if (waitUntil) {
      waitUntil(putPromise);
    } else {
      await putPromise;
    }
  } catch (e) {}

  return enriched;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: "Missing slug" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
  const profile = await readProfile(slug, context.env);
  return new Response(JSON.stringify(profile || {}), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

export async function onRequestHead(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  if (!slug) {
    return new Response(null, { status: 400, headers: CORS_HEADERS });
  }
  return new Response(null, {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: "Missing slug" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await context.request.json();
    const waitUntil = context.waitUntil ? context.waitUntil.bind(context) : null;
    const saved = await writeProfile(slug, body, context.env, waitUntil);
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

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  if (slug) {
    const waitUntil = context.waitUntil ? context.waitUntil.bind(context) : null;
    await writeProfile(slug, {}, context.env, waitUntil);
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}
