// Cloudflare Pages Function for /api/accounts
import { handleApiRequest } from "../../mytyson-edge-api.js";

export async function onRequest(context) {
  return await handleApiRequest(context.request, context.env, context);
}
