import { handleMyTysonApiRequest } from "../../mytyson-edge-api.js";

export async function onRequest(context) {
  const waitUntil = context.waitUntil ? context.waitUntil.bind(context) : null;
  const resp = await handleMyTysonApiRequest(context.request, context.env, waitUntil);
  return resp || new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404 });
}
