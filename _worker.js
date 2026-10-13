export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy dynamic API requests and uploaded media files to the backend
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
      // Set BACKEND_URL in Cloudflare Pages > Settings > Environment Variables
      // Default fallback points to active live tunnel:
      const backendBase = (env.BACKEND_URL || "https://tank-perl-uri-hazardous.trycloudflare.com").replace(/\/+$/, "");
      const targetUrl = new URL(url.pathname + url.search, backendBase);

      const modifiedHeaders = new Headers(request.headers);
      modifiedHeaders.set("X-Forwarded-Host", url.host);
      modifiedHeaders.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow",
      });

      return fetch(proxyRequest);
    }

    // Serve static site assets natively from Cloudflare Pages CDN
    return env.ASSETS.fetch(request);
  }
};
