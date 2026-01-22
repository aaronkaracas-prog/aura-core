// AURA_DEPLOYER__2026-01-21__STEP_18__PHRASE_GATE_FIXED__TARGET_AWARE
// Deployer worker that uploads a JS module bundle to Cloudflare Workers via API.
// Security:
// - Requires X-Deploy-Key header to match env.DEPLOY_SECRET for all requests.
// - Requires a promotion phrase ONLY for production deployments.
//   - Phrase can be supplied via JSON body OR headers (standardized).
//   - If provided but wrong, returns "promotion_phrase_invalid" (not "required") to end guessing.

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function b64ToBytes(b64) {
  // atob works in Workers
  const bin = atob(String(b64 || ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function makeModuleUploadForm(scriptName, bundleBytes, compatibilityDate) {
  const form = new FormData();
  // Cloudflare Workers "modules" upload expects a "main" part (JS module) as Blob.
  const blob = new Blob([bundleBytes], { type: "application/javascript+module" });
  form.append("main", blob, "index.js");

  const meta = {
    main_module: "index.js",
  };
  if (compatibilityDate) meta.compatibility_date = compatibilityDate;

  form.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }), "metadata.json");
  return form;
}

function pickTarget(payload) {
  const t =
    (payload && (payload.target || payload.env || payload.environment)) ||
    null;
  if (!t) return null;
  const s = String(t).toLowerCase();
  if (s === "prod" || s === "production") return "prod";
  if (s === "staging" || s === "stage") return "staging";
  return s;
}

function extractPhraseFromRequest(request, payload) {
  // Prefer explicit body fields
  const bodyPhrase =
    (payload && (payload.promote_phrase || payload.promotion_phrase || payload.promotionPhrase || payload.phrase)) ||
    null;

  // Also accept headers (Aura-core sends several; deployer standardizes these)
  const headerPhrase =
    request.headers.get("X-Promotion-Phrase") ||
    request.headers.get("X-Promote-Phrase") ||
    request.headers.get("X-Aura-Phrase") ||
    request.headers.get("X-Phrase") ||
    null;

  return bodyPhrase || headerPhrase || null;
}

function requirePromotionPhrase({ env, request, payload }) {
  // Require phrase if:
  // - target explicitly prod, OR
  // - script_name matches PROD_SCRIPT_NAME
  const target = pickTarget(payload);
  const scriptName = payload && payload.script_name ? String(payload.script_name) : "";
  const isProdByTarget = target === "prod";
  const isProdByName = !!env.PROD_SCRIPT_NAME && scriptName === env.PROD_SCRIPT_NAME;
  if (!isProdByTarget && !isProdByName) return { needed: false };

  if (!env.PROMOTE_PHRASE) {
    return { needed: true, misconfigured: true };
  }

  const phrase = extractPhraseFromRequest(request, payload);
  if (!phrase) return { needed: true, present: false, ok: false };

  if (String(phrase) !== String(env.PROMOTE_PHRASE)) {
    return { needed: true, present: true, ok: false };
  }

  return { needed: true, present: true, ok: true };
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405);
      }

      // Auth: deploy secret header
      const key =
        request.headers.get("X-Deploy-Key") ||
        request.headers.get("X-Deploy-Secret") ||
        "";

      if (!env.DEPLOY_SECRET || key !== env.DEPLOY_SECRET) {
        return json(
          {
            ok: false,
            error: "unauthorized",
            auth_diag: {
              header_present: !!key,
              header_len: (key || "").length,
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

      const {
        script_name,
        bundle_b64,
        compatibility_date,
      } = payload || {};

      if (!script_name || !bundle_b64) {
        return json({ ok: false, error: "missing_required_fields" }, 400);
      }

      // Promotion phrase gate (prod only)
      const gate = requirePromotionPhrase({ env, request, payload });
      if (gate.needed) {
        if (gate.misconfigured) {
          return json({ ok: false, error: "deployer_misconfigured_missing_PROMOTE_PHRASE" }, 500);
        }
        if (!gate.present) {
          return json({ ok: false, error: "promotion_phrase_required" }, 403);
        }
        if (!gate.ok) {
          return json({ ok: false, error: "promotion_phrase_invalid" }, 403);
        }
      }

      const bundleBytes = b64ToBytes(bundle_b64);
      const form = makeModuleUploadForm(script_name, bundleBytes, compatibility_date);

      if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) {
        return json({ ok: false, error: "missing_cloudflare_api_config" }, 500);
      }

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
    } catch (err) {
      return json(
        {
          ok: false,
          error: "internal_error",
          message: err && err.message ? String(err.message) : "unknown",
        },
        500
      );
    }
  },
};
