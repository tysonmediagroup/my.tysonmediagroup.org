export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: "Missing slug" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  if (context.env && context.env.MYTYSON_KV) {
    const val = await context.env.MYTYSON_KV.get("profile:" + slug);
    return new Response(val || "{}", {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  return new Response(JSON.stringify({ ok: true, mode: "client-storage" }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

export async function onRequestPost(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  const body = await context.request.text();
  if (slug && context.env && context.env.MYTYSON_KV) {
    await context.env.MYTYSON_KV.put("profile:" + slug, body);
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
