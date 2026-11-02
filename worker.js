// Cloudflare Worker for my.tysonmediagroup.org
// Delegates all /api/* routes (D1 + KV + Edge Cache + Google SSO + Auth) to mytyson-edge-api.js

import { handleApiRequest } from "./mytyson-edge-api.js";

export default {
  async fetch(request, env, ctx) {
    const apiResponse = await handleApiRequest(request, env, ctx);
    if (apiResponse) {
      return apiResponse;
    }

    // Serve static assets
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not Found", { status: 404 });
  }
};
