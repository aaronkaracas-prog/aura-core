// AURA_CORE__2026-01-21__AUTONOMY_STEP_14__FOUNDY_PROXY_DEPLOY_SECRET_DIAG__01
// FIX: Removed Headers.keys() diagnostics that caused 1101 crashes

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      const admin =
        request.headers.get("X-Core-Pass") ||
        request.headers.get("X-Aura-Pass") ||
        request.headers.get("X-Admin-Token");

      if (url.pathname.startsWith("/admin")) {
        if (!admin || admin !== env.AURA_ADMIN_TOKEN) {
          return new Response(
            JSON.stringify({ ok: false, error: "unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      if (url.pathname === "/admin/foundry/deploy" && request.method === "POST") {
        const body = await request.text();

        const resp = await env.AURA_DEPLOYER.fetch("https://deployer/deploy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Deploy-Key": env.DEPLOY_SECRET
          },
          body
        });

        return new Response(await resp.text(), { status: resp.status });
      }

      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "aura-core",
            version:
              "AURA_CORE__2026-01-21__AUTONOMY_STEP_14__FOUNDY_PROXY_DEPLOY_SECRET_DIAG__01"
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("ok");
    } catch (err) {
      return new Response("internal error", { status: 500 });
    }
  }
};
