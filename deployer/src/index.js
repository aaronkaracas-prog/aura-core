
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

/**
 * Decode base64 to Uint8Array (bytes) — no string corruption.
 */
function b64ToBytes(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Cloudflare Workers Script Upload API (MODULE):
 * - include `metadata` (application/json) with `main_module`
 * - upload entrypoint as application/javascript+module
 * - preserve bindings
 */
function makeModuleUploadForm(script_name, bundleBytes, compatibility_date) {
  const fd = new FormData();

  const bindings = [
    {
      type: "kv_namespace",
      name: "AURA_KV",
      namespace_id: "9c2ba111589e48c6ba5ad1b924ae8809",
    },
    {
      type: "service",
      name: "AURA_DEPLOYER",
      service: "aura-deployer",
    },
  ];

  const metadataObj = {
    main_module: "index.js",
    compatibility_date: compatibility_date || "2026-01-14",
    bindings,
  };

  fd.append(
    "metadata",
    new File([JSON.stringify(metadataObj)], "metadata.json", {
      type: "application/json",
    })
  );

  fd.append(
    "index.js",
    new File([bundleBytes], "index.js", {
      type: "application/javascript+module",
    })
  );

  return fd;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "aura-deployer",
        staging_target: env.STAGING_SCRIPT_NAME,
        prod_target: env.PROD_SCRIPT_NAME,
        has_deploy_key: !!env.DEPLOY_SECRET,
        has_cf_api_token: !!env.CF_API_TOKEN,
        account_id: env.CF_ACCOUNT_ID,
        version: "AURA_DEPLOYER__2026-01-17__MODULE_BYTES__01",
      });
    }

    if (url.pathname === "/deploy" && request.method === "POST") {
      const key = request.headers.get("x-deploy-key") || "";
      if (!env.DEPLOY_SECRET || key !== env.DEPLOY_SECRET) {
        // Minimal auth diagnostics (does NOT reveal secret values)
        // Helps verify whether aura-core is actually sending x-deploy-key
        return json(
          {
            ok: false,
            error: "unauthorized",
            auth_diag: {
              header_present: !!key,
              header_len: key.length,
              env_present: !!env.DEPLOY_SECRET,
              env_len: (env.DEPLOY_SECRET || "").length,
              match: !!env.DEPLOY_SECRET && key === env.DEPLOY_SECRET,
            },
          },
          401
        );
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ ok: false, error: "invalid_json" }, 400);
      }

      const { script_name, bundle_b64, promote_phrase, compatibility_date } =
        payload || {};

      if (!script_name || !bundle_b64) {
        return json({ ok: false, error: "missing_required_fields" }, 400);
      }

      if (
        script_name === env.PROD_SCRIPT_NAME &&
        promote_phrase !== env.PROMOTE_PHRASE
      ) {
        return json({ ok: false, error: "promotion_phrase_required" }, 403);
      }

      const bundleBytes = b64ToBytes(bundle_b64);
      const form = makeModuleUploadForm(
        script_name,
        bundleBytes,
        compatibility_date
      );

      const upload = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${script_name}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${env.CF_API_TOKEN}`,
          },
          body: form,
        }
      );

      let result;
      try {
        result = await upload.json();
      } catch {
        result = null;
      }

      if (!upload.ok || !result || result.success !== true) {
        return json(
          {
            ok: false,
            error: "cloudflare_upload_failed",
            status: upload.status,
            detail: result,
          },
          500
        );
      }

      return json({ ok: true, deployed: script_name });
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
