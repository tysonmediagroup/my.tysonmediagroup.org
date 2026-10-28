// Cloudflare Pages Function for /api/auth/register

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate"
};

function accountsCacheKey() {
  return new Request("https://my.tysonmediagroup.org/_internal_edge_accounts_v1", { method: "GET" });
}

function profileCacheKey(slug) {
  return new Request(`https://my.tysonmediagroup.org/_internal_edge_profile_v1/${encodeURIComponent(slug)}`, { method: "GET" });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
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

    // Read existing accounts
    let accounts = [];
    if (context.env && context.env.MYTYSON_KV) {
      try {
        const kvVal = await context.env.MYTYSON_KV.get("system:accounts");
        if (kvVal) accounts = JSON.parse(kvVal);
      } catch (e) {}
    }
    if (!accounts.length) {
      try {
        const cache = caches.default;
        const cachedResp = await cache.match(accountsCacheKey());
        if (cachedResp) accounts = await cachedResp.json();
      } catch (e) {}
    }

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
    const rawAccs = JSON.stringify(accounts);

    if (context.env && context.env.MYTYSON_KV) {
      try { await context.env.MYTYSON_KV.put("system:accounts", rawAccs); } catch (e) {}
    }

    try {
      const cache = caches.default;
      const respAccs = new Response(rawAccs, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000" } });
      const p1 = cache.put(accountsCacheKey(), respAccs);
      if (context.waitUntil) context.waitUntil(p1); else await p1;
    } catch (e) {}

    // Initial profile
    const initialProfile = {
      slug: slug,
      displayName: dName,
      firstName: newAcc.firstName,
      lastName: newAcc.lastName,
      showRealName: newAcc.showRealName,
      bio: newAcc.bio,
      division: newAcc.division,
      updatedAt: Date.now()
    };
    const rawProf = JSON.stringify(initialProfile);

    if (context.env && context.env.MYTYSON_KV) {
      try { await context.env.MYTYSON_KV.put(`profile:${slug}`, rawProf); } catch (e) {}
    }
    try {
      const cache = caches.default;
      const respProf = new Response(rawProf, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000" } });
      const p2 = cache.put(profileCacheKey(slug), respProf);
      if (context.waitUntil) context.waitUntil(p2); else await p2;
    } catch (e) {}

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
