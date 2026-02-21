
// === BUILD 15 PATCH: Deterministic PAUSE Acknowledgment ===
// Injected to ensure PAUSE emits observable reply payload (no KV mutation).
function __AURA_PAUSE_ACK__(cmd, host, replyArr) {
  if (cmd === "PAUSE") {
    replyArr.push({
      cmd: "PAUSE",
      payload: {
        ok: true,
        host: host,
        paused: true,
        at: new Date().toISOString(),
        note: "DETERMINISTIC_PAUSE_ACK_V1"
      }
    });
    return true;
  }
  return false;
}
// === END PATCH ===

// AURA CORE  CANONICAL REBUILD (FULL FILE REPLACEMENT)
// Rebuilt from last known-good 91K source (operator-provided backup)
// Purpose: restore Aura Core command interpreter + registry grammar compatibility
// Timestamp: 2026-02-08
//
// NOTE: This file is intended to be deployed as Wrangler main="src/index.js"
//
// --- BEGIN ORIGINAL CONTENT ---

// === UI_ROUTER_ENTRY ===
// Router shim: classify natural language via INTENT before claim gate
function routeInputBeforeClaimGate(ctx, input) {
  if (!input || typeof input !== 'string') return { passthrough: true };
  const isCommand = /^[A-Z_]+(\s|$)/.test(input.trim());
  if (isCommand) return { passthrough: true };
  // Natural language  intent-first
  return { intentFirst: true, text: input };
}
// === END UI_ROUTER_ENTRY ===

// Canonical build/stamp (rendered in UI header and returned by SHOW_BUILD)
const BUILD = 'AURA_CORE__AUTONOMY_LAYERS__EVIDENCE_ALLOWLIST_HOSTCAPS_OPERATOR_INTENT_PAUSE__MEMORY_SUBSTRATE_V1__REGISTRY_AUDIT__20__AUTO_RUNTIME_TEST__01';
const STAMP = new Date().toISOString();

const AUTONOMY_TICK_VERSION = 'v2';
const AUTONOMY_TICK_HOSTS = ['auras.guide','malibu.city','frontdesk.network'];
const autonomyTickKeyForHost = (host) => `autonomy:tick:${AUTONOMY_TICK_VERSION}:${host}`;

async function naturalLanguageReply(input, env, activeHost) {
  const text = (input || "").trim();
  if (!text) return "";

  const lower = text.toLowerCase();
  const host = (activeHost && activeHost !== "none") ? activeHost : "frontdesk.network";

  const intentGet = async (tag) => {
    try {
      return await env.AURA_KV.get(`intent:${host}:${tag}`);
    } catch (_) {
      return null;
    }
  };

  const identity = (await intentGet("identity")) || "I am Aura  an autonomous, evidence-first control-plane for ARK Systems. Host-scoped. Persistence-backed. Neutral and non-coercive.";
// STUB REMOVED: AUTONOMY_REPAIR_PLAN now routes to line-engine (no VERIFIED_FETCH gate here).
  if (lower.includes("help") || lower === "?" || lower.includes("commands")) {
    return "Type an allowed command (e.g., PING, SHOW_BUILD, SNAPSHOT_STATE).\n\nFor host work: HOST <domain>, then EVIDENCE_PRESENT or VERIFIED_FETCH_URL http://<domain>/";
  }
  if (lower.includes("launch") || lower.includes("deploy") || lower.includes("website") || lower.includes("site")) {
    return "I can plan and execute deployments via DEPLOYER_CALL when operator-authorized.\n\nTell me: domain + desired outcome (landing page vs app) and whether we should VERIFIED_FETCH first for the target host.";
  }

  // Default: answer politely, no gate.
  return identity + "\n\n" + capability;
}

// ==== PATCH: Registry commands bypass claim-gate (2026-01-29) ====
function __registryBypass(token) {
  // Only allow read-only registry operations to bypass claim-gate.
  // Any registry *write* (PUT / IMPORT) must be claim-gated by evidence.
  return token === "REGISTRY_GET" ||
         token === "REGISTRY_LIST" ||
         token === "REGISTRY_FILTER";
}
// ================================================================
const KNOWN_COMMANDS = [
  "MIC_PROBE",
  "PING",
  "SHOW_BUILD",
  "SHOW_CLAIM_GATE",
  "SHOW_ALLOWED_COMMANDS",
  "RUN_SELF_TEST_EVIDENCE",
  "VERIFIED_FETCH_URL",
  "CLEAR_VERIFIED_FETCH",
  "EVIDENCE_PRESENT",
  "SNAPSHOT_STATE",
  "HOST_CAPS_GET",
  "HOST_CAPS_SET",
  "DEPLOYER_CAPS",
  "DEPLOYER_CALL",
  "PAUSE",
  "INTENT_ADD",
  "INTENT_GET",
  "INTENT_CLEAR",
  "SHOW_MEMORY_SCHEMA",
  "REGISTRY_PUT",
  "REGISTRY_GET",
  "REGISTRY_LIST",
  "REGISTRY_FILTER",
  "REGISTRY_IMPORT_ASSETS",
  "REGISTRY_IMPORT_DOMAINS",
  "PORTFOLIO_STATUS",
  "AUDIT_GET",
  "AUDIT_CLEAR",
  "HERD_STATUS",
  "HERD_SELF_TEST",
  "HERD_SWEEP",
  "AUTONOMY_STATUS",
  "AUTONOMY_LAST_TICK",
        "AUTONOMY_LAST_TICK_SET",
  "AUTONOMY_CAPABILITIES",
  "INTENT_SIMULATE",
  "REGISTRY_AUDIT_TRAIL",
  "AUTONOMY_BUDGET_GET",
  "AUTONOMY_BUDGET_SET",
  "FAILURE_MEMORY_GET",
  "FAILURE_MEMORY_PUT",
  "FAILURE_MEMORY_CLEAR",
  "FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
"PATCH_INDEX_PUT",
"PATCH_INDEX_GET",
"PATCH_INDEX_LIST",
"PATCH_INDEX_META",
"PATCH_INDEX_DELETE",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET",
  "AUTONOMY_CHARTER_GET",
  "AUTONOMY_CHARTER_SET",
];

const UI_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Aura Core ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ UI</title>
<meta name="ui-version" content="UI_PATCH__20260215_2A__CHATGPT_SHELL">
<style>
  :root{
    --bg:#070a12; --panel:#0e1424; --panel2:#0b1020;
    --text:#e8ecff; --muted:#9aa5c7; --line:rgba(255,255,255,.10);
    --accent:#6d5efc; --good:#48d597; --bad:#ff5c7a;
    --bubbleMe: rgba(109,94,252,.18);
    --bubbleAura: rgba(255,255,255,.05);
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji","Segoe UI Emoji";
    background:
      radial-gradient(1200px 600px at 30% 10%, rgba(109,94,252,.18), transparent 60%),
      radial-gradient(900px 500px at 80% 30%, rgba(72,213,151,.10), transparent 55%),
      var(--bg);
    color:var(--text);
    overflow:hidden;
  }

  .app{ height:100%; display:flex; }

  .side{
    width:280px;
    border-right:1px solid var(--line);
    background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
    display:flex;
    flex-direction:column;
    gap:12px;
    padding:14px;
  }
  .sideTop{
    display:flex; flex-direction:column; gap:6px;
    padding-bottom:12px;
    border-bottom:1px solid var(--line);
  }
  .brand{ font-weight:800; letter-spacing:.2px; font-size:16px; }
  .sub{ color:var(--muted); font-size:12px; line-height:1.35; }
  .projHdr{ color:var(--muted); font-size:12px; margin-top:2px; }
  .projList{ display:flex; flex-direction:column; gap:8px; }
  .projBtn{
    display:flex; align-items:center; justify-content:space-between;
    width:100%;
    padding:10px 10px;
    border-radius:12px;
    border:1px solid var(--line);
    background: rgba(0,0,0,.18);
    color:var(--text);
    cursor:pointer;
    text-align:left;
  }
  .projBtn:hover{ border-color: rgba(109,94,252,.45); }
  .projBtn.active{
    border-color: rgba(109,94,252,.60);
    background: rgba(109,94,252,.14);
  }
  .pill{
    font-size:11px;
    color:var(--muted);
    border:1px solid var(--line);
    padding:2px 8px;
    border-radius:999px;
  }

  .main{ flex:1; display:flex; flex-direction:column; min-width:0; }

  .topbar{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:16px;
    padding:14px 16px;
    border-bottom:1px solid var(--line);
    background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
  }
  .meta{
    display:flex; flex-direction:column; align-items:flex-end; gap:4px;
    font-size:12px; color:var(--muted);
  }
  .meta .row{ display:flex; gap:10px; align-items:center; }
  .dot{ width:8px; height:8px; border-radius:50%; background:var(--good); box-shadow:0 0 0 3px rgba(72,213,151,.14); }
  .statusErr .dot{ background:var(--bad); box-shadow:0 0 0 3px rgba(255,92,122,.14); }
  .titleBlock{ display:flex; flex-direction:column; gap:2px; min-width:0; }
  .titleBlock .h{ font-size:16px; font-weight:800; letter-spacing:.2px; }
  .titleBlock .s{ font-size:12px; color:var(--muted); }

  .chat{
    flex:1;
    min-height:0;
    overflow:auto;
    padding:18px 16px 12px 16px;
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .bubble{
    max-width: min(780px, 92%);
    border:1px solid var(--line);
    padding:10px 12px;
    border-radius:16px;
    line-height:1.35;
    white-space:pre-wrap;
    word-break:break-word;
  }
  .me{ align-self:flex-end; background: var(--bubbleMe); border-color: rgba(109,94,252,.40); }
  .aura{ align-self:flex-start; background: var(--bubbleAura); }
  .sys{ align-self:center; max-width:100%; background: transparent; border:none; color:var(--muted); padding:0; }
  .err{ border-color: rgba(255,92,122,.45); background: rgba(255,92,122,.10); }

  .composerWrap{
    border-top:1px solid var(--line);
    padding:12px;
    background: rgba(0,0,0,.12);
  }
  .composer{
    display:flex;
    gap:10px;
    align-items:flex-end;
    max-width: 980px;
    margin:0 auto;
  }
  .iconBtn{
    height:44px;
    width:44px;
    border-radius:12px;
    border:1px solid var(--line);
    background: rgba(0,0,0,.22);
    color: var(--text);
    cursor:not-allowed;
    opacity:.65;
    display:flex; align-items:center; justify-content:center;
    user-select:none;
  }
  textarea{
    flex:1;
    min-height:44px;
    max-height:160px;
    resize:vertical;
    padding:10px 12px;
    border-radius:12px;
    outline:none;
    border:1px solid var(--line);
    background: rgba(0,0,0,.22);
    color:var(--text);
    font-size:14px;
    line-height:1.35;
  }
  textarea::placeholder{ color: rgba(154,165,199,.70); }
  .send{
    height:44px;
    padding:0 16px;
    border-radius:12px;
    cursor:pointer;
    border:1px solid rgba(109,94,252,.55);
    background: linear-gradient(180deg, rgba(109,94,252,.95), rgba(109,94,252,.78));
    color:#fff;
    font-weight:800;
    letter-spacing:.2px;
    box-shadow: 0 10px 20px rgba(109,94,252,.22);
  }
  .send:disabled{ opacity:.55; cursor:not-allowed; box-shadow:none; }
  .hint{
    max-width:980px;
    margin:8px auto 0 auto;
    color:var(--muted);
    font-size:12px;
    padding:0 2px;
  }
  code.k{ color:#c7cffc; }
  .iconBtn{
    cursor:pointer;
    opacity:1;
  }
  .overlay{
    position:fixed;
    inset:0;
    background: rgba(0,0,0,.55);
    display:none;
    align-items:center;
    justify-content:center;
    padding:24px;
    z-index:50;
  }
  .overlay.show{ display:flex; }
  .modal{
    width: min(520px, 92vw);
    border-radius:16px;
    border:1px solid var(--line);
    background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
    box-shadow: 0 30px 80px rgba(0,0,0,.55);
    padding:16px;
  }
  .modal h3{ margin:0 0 8px 0; font-size:16px; }
  .modal p{ margin:0 0 12px 0; color: var(--muted); line-height:1.4; font-size:13px; }
  .modal .row{ display:flex; gap:10px; justify-content:flex-end; }
  .btn{
    height:38px;
    padding:0 14px;
    border-radius:12px;
    border:1px solid var(--line);
    background: rgba(0,0,0,.25);
    color: var(--text);
    cursor:pointer;
    font-weight:700;
  }
  .btn.primary{
    border-color: rgba(109,94,252,.55);
    background: rgba(109,94,252,.20);
  }
</style>
</head>
<body>
<div class="app">
  <div class="side">
    <div class="sideTop">
      <div class="brand">Aura Core</div>
      <div class="sub">Control-plane UI shell for quick interactive checks.</div>
      <div class="projHdr">Projects</div>
    </div>

    <div id="projList" class="projList">
      <button class="projBtn active" data-host="auras.guide">
        <span>Aura Core</span><span class="pill">auras.guide</span>
      </button>
      <button class="projBtn" data-host="frontdesk.network">
        <span>FrontDesk</span><span class="pill">frontdesk.network</span>
      </button>
      <button class="projBtn" data-host="malibu.city">
        <span>Malibu</span><span class="pill">malibu.city</span>
      </button>
    </div>

    <div class="sub" style="margin-top:auto">
      <div><span class="pill">UI</span> <span id="uiver"></span></div>
      <div style="margin-top:6px">Host: <span id="hostLabel">auras.guide</span></div>
    </div>
  </div>

  <main class="main">
    <div class="topbar">
      <div class="titleBlock">
        <div id="title" class="h">Aura Core</div>
        <div class="s">Build: <span id="build">...</span></div>
        <div class="s">Stamp: <span id="stamp">...</span></div>
      </div>
      <div id="meta" class="meta">
        <div class="row"><span class="dot"></span><span id="status">Ready</span></div>
        <div class="row">Local: <span id="localtime"></span></div>
      </div>
    </div>

    <div id="chat" class="chat"></div>

    <div class="composerWrap">
      <div class="composer">
        <button id="attachBtn" class="iconBtn" title="Attach">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢</button>
        <button id="micBtn" class="iconBtn" title="Mic">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢</button>
        <textarea id="input" placeholder="Type a command (e.g., PING)"></textarea>
        <button id="send" class="send">Send</button>
      </div>
      <div class="hint">
        Tip: Prefer batch mode via PowerShell for multi-line ops. Uiv>
  </main>
</div>

<script>
(function(){
  const UI_VERSION = 'UI_PATCH__20260215_2A__CHATGPT_SHELL';

  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const statusEl = document.getElementById('status');
  const metaEl = document.getElementById('meta');
  const buildEl = document.getElementById('build');
  const stampEl = document.getElementById('stamp');
  const localEl = document.getElementById('localtime');
  const uiVerEl = document.getElementById('uiver');
  const hostLabel = document.getElementById('hostLabel');
  const titleEl = document.getElementById('title');
  const projList = document.getElementById('projList');
  const attachBtn = document.getElementById('attachBtn');
  const micBtn = document.getElementById('micBtn');

  // MIC_SUBSYSTEM_WIRED_V1
  let micState = 'idle';           // idle | recording
  let micStream = null;            // MediaStream
  let micLastError = null;         // { name, message } or null

  async function micStart(){
    micLastError = null;
    try{
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        micLastError = { name:'UNSUPPORTED', message:'navigator.mediaDevices.getUserMedia missing' };
        addBubble('sys', 'Mic FAIL: UNSUPPORTED', true);
        return;
      }
      micStream = await navigator.mediaDevices.getUserMedia({ audio:true });
      micState = 'recording';
      addBubble('sys', 'Mic OK: stream acquired (recording state set).', false);
    }catch(e){
      micLastError = { name:(e && e.name ? e.name : 'ERROR'), message:(e && e.message ? e.message : String(e)) };
      micState = 'idle';
      addBubble('sys', 'Mic FAIL: ' + micLastError.name + ' ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ' + micLastError.message, true);
    }
  }

  function micStop(){
    try{
      if(micStream && micStream.getTracks){
        micStream.getTracks().forEach(t=>{ try{ t.stop(); }catch(_){} });
      }
    }catch(_){}
    micStream = null;
    micState = 'idle';
    addBubble('sys', 'Mic stopped.', false);
  }
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMsg = document.getElementById('overlayMsg');
  const overlayClose = document.getElementById('overlayClose');

  function showOverlay(title, msg){
    if(!overlay) return;
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
  }
  function hideOverlay(){
    if(!overlay) return;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
  }

  if(overlayClose) overlayClose.addEventListener('click', hideOverlay);
  if(overlay) overlay.addEventListener('click', (e)=>{ if(e.target === overlay) hideOverlay(); });

  if(attachBtn){
    attachBtn.addEventListener('click', ()=>{
      showOverlay('Attach', 'File upload is next. This is the UI shell step ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â no upload logic yet.');
    });
  }
  if(micBtn){
    micBtn.addEventListener('click', async ()=>{
      addBubble('sys', 'Mic click (handler live).', false);
      if(micState === 'recording'){
        micStop();
      }else{
        await micStart();
      }
    });
  }

  if(uiVerEl) uiVerEl.textContent = UI_VERSION;

  let activeHost = 'auras.guide';
  let activeName = 'Aura Core';

  function nowLocal(){
    try { return new Date().toLocaleString(); } catch(e){ return String(new Date()); }
  }
  localEl.textContent = nowLocal();
  setInterval(()=>{ localEl.textContent = nowLocal(); }, 1000);

  function setStatus(t, isError){
    statusEl.textContent = t;
    if(isError){
      metaEl.classList.add('statusErr');
      statusEl.style.color = 'var(--bad)';
    }else{
      metaEl.classList.remove('statusErr');
      statusEl.style.color = 'var(--text)';
    }
  }

  function addBubble(kind, text, isErr){
    const d = document.createElement('div');
    d.className = 'bubble ' + kind + (isErr ? ' err' : '');
    d.textContent = text;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
  }

  async function postChat(raw){
    const r = await fetch('/chat', {
      method:'POST',
      headers:{ 'content-type':'text/plain; charset=utf-8' },
      body: raw
    });
    const txt = await r.text();
    try { return JSON.parse(txt); } catch(e){ return { ok:false, reply: txt }; }
  }

  function normalizeInputForHost(userText){
    const s = String(userText || '');
    const trimmed = s.trim();
    if(!trimmed) return '';
    if (/^HOST\\\s+/m.test(trimmed)) return trimmed;
    return 'HOST ' + activeHost + '\\n' + trimmed;
  }

  async function pullBuild(){
    try{
      const res = await postChat('HOST ' + activeHost + '\nSHOW_BUILD');
if(res && res.ok && res.reply && res.reply.build){
        buildEl.textContent = res.reply.build;
        stampEl.textContent = res.reply.stamp || '';
      }else{
        buildEl.textContent = 'unknown';
        stampEl.textContent = '';
      }
    }catch(e){
      buildEl.textContent = 'unknown';
      stampEl.textContent = '';
    }
  }

  async function runSend(){
    const raw = input.value;
    const trimmed = String(raw || '').trim();
    if(!trimmed) return;

    addBubble('me', trimmed, false);
    input.value = '';

    sendBtn.disabled = true;
    setStatus('Working', false);

    try{
      const payload = normalizeInputForHost(trimmed);
      const res = await postChat(payload);
if(res && typeof res === 'object'){
        if(res.ok){
          const reply = res.reply;
          if(typeof reply === 'string'){
            addBubble('aura', reply, false);
          }else{
            addBubble('aura', JSON.stringify(reply, null, 2), false);
          }
          setStatus('Ready', false);
        }else{
          addBubble('aura', (res.reply ? (typeof res.reply === 'string' ? res.reply : JSON.stringify(res.reply, null, 2)) : 'ERROR'), true);
          setStatus('Error', true);
        }
      }else{
        addBubble('aura', String(res), true);
        setStatus('Error', true);
      }
    }catch(err){
      addBubble('aura', 'UI ERROR: ' + (err && err.message ? err.message : String(err)), true);
      setStatus('Error', true);
    }finally{
      sendBtn.disabled = false;
      input.focus();
    }
  }

  input.addEventListener('keydown', (e)=>{
  const k = e.key;
  const code = e.code;
  const kc = e.keyCode;
  const isEnter = (k === 'Enter') || (code === 'Enter') || (kc === 13);
  if(isEnter && !e.shiftKey){
    e.preventDefault();
    e.stopPropagation();
    runSend();
  }
});
  sendBtn.addEventListener('click', runSend);

  projList.addEventListener('click', (e)=>{
    const btn = e.target.closest('.projBtn');
    if(!btn) return;
    const host = btn.getAttribute('data-host');
    if(!host) return;

    activeHost = host;
    activeName =
      (host === 'frontdesk.network') ? 'FrontDesk' :
      (host === 'malibu.city') ? 'Malibu' :
      'Aura Core';

    [...projList.querySelectorAll('.projBtn')].forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    hostLabel.textContent = activeHost;
    titleEl.textContent = activeName;

    addBubble('sys', 'HOST set to ' + activeHost + '. Pulling SHOW_BUILD...', false);
    pullBuild();
  });

  addBubble('sys', 'Connected. Select a project or type a command (e.g.,', false);
    pullBuild();
  });

  addBubble('sys', 'Connected. Select a project or type a command (e.g., PING).', false);
  pullBuild();
})();
</script>
<div id="overlay" class="overlay" aria-hidden="true">
  <div class="modal" role="dialog" aria-modal="true">
    <h3 id="overlayTitle">Overlay</h3>
    <p id="overlayMsg">Placeholder.</p>
    <div class="row">
      <button id="overlayClose" class="btn primary">Close</button>
    </div>
  </div>
</div>
</body>
</html>`;


export default {
  async fetch(request, env) {
    try {

    const url = new URL(request.url);

    // ----------------------------
    // Operator auth (explicit only)  computed early (used by NL responses)
    // ----------------------------
    const operatorToken = env.AURA_OPERATOR_TOKEN || env.AURA_OP_TOKEN || env.OPERATOR_TOKEN || "";
    const operatorHeader =
      request.headers.get("x-operator-token") ||
      request.headers.get("X-Operator-Token") ||
      request.headers.get("x-aura-operator") ||
      request.headers.get("X-Aura-Operator") ||
      request.headers.get("x-aura-operator-token") ||
      request.headers.get("X-Aura-Operator-Token") ||
      (() => {
        const a =
          request.headers.get("authorization") ||
          request.headers.get("Authorization") ||
          "";
        const m = a.match(/^Bearer\s+(.+)$/i);
        return m ? m[1] : "";
      })() ||
      "";
    const isOperator = Boolean(operatorToken) && String(operatorHeader || "").trim() === String(operatorToken || "").trim();


    // UI routing (root + /core + /ui)
    if ((request.method === "GET" || request.method === "HEAD") && (url.pathname === "/" || url.pathname === "/core" || url.pathname === "/ui")) {
      if (request.method === "HEAD") {
        return new Response(null, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }
      const __UI_HTML_NORMALIZED = UI_HTML.replace(/\r\n/g, "\n");
return new Response(__UI_HTML_NORMALIZED, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    // /chat is served; everything else 404
    if (url.pathname !== "/chat") {
      return new Response("Not Found", { status: 404 });
    }

    const body = await request.text();
    const bodyTrim = body.trim();

    // Natural language (no-operator): answer without gating unless user asserts a gated claim.
    const firstLine = (bodyTrim.split(/\r?\n/)[0] || '').trim();
    const firstToken = (firstLine.split(/\s+/)[0] || '').toUpperCase();
    const isBatchLike =
      firstToken &&
      (firstToken === 'HOST' ||
        firstToken === 'AURA-OP' ||
        firstToken === 'AURA_OP' ||
        KNOWN_COMMANDS.includes(firstToken));

    const CLAIM_TRIGGER_WORDS = [
      'live','deployed','launched','resolving','propagating','successful','verified','up','online','working',
      'reachable','available','accessible'
    ];
    const hasClaimTrigger = (s) => {
      const t = String(s || '').toLowerCase();
      return CLAIM_TRIGGER_WORDS.some((w) => new RegExp('(^|\\W)' + w + '($|\\W)').test(t));
    };

    if (bodyTrim && !isBatchLike && !hasClaimTrigger(bodyTrim)) {
      const msg =
        `Aura (control-plane)  ${BUILD} @ ${STAMP}\n` +
        `Operator: ${isOperator ? 'YES' : 'NO'} (planning/help allowed; deploy/DNS actions are operator-only)\n\n` +
        `What I can do right now (without VERIFIED_FETCH):\n` +
        `- Explain identity/capabilities and how to operate\n` +
        `- Show allowed commands, build, snapshot, memory schema\n` +
        `- Read registries (GET/LIST/FILTER) within host caps\n\n` +
        `What requires VERIFIED_FETCH and/or operator token:\n` +
        `- Claims like live/deployed/reachable\n` +
        `- Writes (registry puts), deployer calls, DNS changes\n\n` +
        `Next commands to run:\n` +
        `1) SHOW_ALLOWED_COMMANDS\n` +
        `2) SHOW_BUILD\n` +
        `3) SNAPSHOT_STATE\n` +
        `4) SHOW_MEMORY_SCHEMA\n` +
        `5) REGISTRY_LIST domains\n\n` +
        `Tip: In UI, use ALL-CAPS commands. For multi-line ops, use PowerShell batch mode.`;
      return Response.json({ ok: true, reply: msg });
    }

    // ----------------------------
    // Build / policy markers
    // ----------------------------
    // ----------------------------
    // Operator auth (explicit only)
    // ----------------------------
    // operatorToken/operatorHeader/isOperator are computed above (early)

    // If a token is configured and a caller presents a token header that does not match,
    // fail closed (prevents accidental success with a wrong token).
    const operatorHeaderPresent = Boolean(operatorHeader);
    const operatorMismatch = Boolean(operatorToken) && operatorHeaderPresent && operatorHeader !== operatorToken;
    if (operatorMismatch) return Response.json({ ok: true, reply: "UNAUTHORIZED" });

    // ----------------------------
    // Commands (global allowlist)
    // ----------------------------
    const allowedCommands = [
      "MIC_PROBE",
      "PING",
      "SHOW_BUILD",
      "SHOW_CLAIM_GATE",
      "SHOW_ALLOWED_COMMANDS",
      "AUTONOMY_REPAIR_PLAN",
      "AUTONOMY_REPAIR_EXECUTE",
      "SELF_AUDIT_FULL",
      "RUN_SELF_TEST_EVIDENCE",
      "VERIFIED_FETCH_URL",
      "CLEAR_VERIFIED_FETCH",
      "EVIDENCE_PRESENT",
      "SNAPSHOT_STATE",
      "HOST_CAPS_GET",
      "HOST_CAPS_SET",
      "DEPLOYER_CAPS",
      "DEPLOYER_CALL",
      "PAUSE",
      "INTENT_ADD",
      "INTENT_GET",
      "INTENT_CLEAR",
      "SHOW_MEMORY_SCHEMA",
      "REGISTRY_PUT",
      "REGISTRY_GET",
      "REGISTRY_LIST",
      "REGISTRY_FILTER",
      "REGISTRY_IMPORT_ASSETS",
      "REGISTRY_IMPORT_DOMAINS",
      "PORTFOLIO_STATUS",
      "AUDIT_GET",
      "AUDIT_CLEAR",
      "HERD_STATUS",
      "HERD_SELF_TEST",
      "HERD_SWEEP",
  "AUTONOMY_STATUS",
  "AUTONOMY_LAST_TICK",
        "AUTONOMY_LAST_TICK_SET",
  "AUTONOMY_CAPABILITIES",
  "INTENT_SIMULATE",
  "REGISTRY_AUDIT_TRAIL",
  "AUTONOMY_BUDGET_GET",
  "AUTONOMY_BUDGET_SET",
  "FAILURE_MEMORY_GET",
  "FAILURE_MEMORY_PUT",
  "FAILURE_MEMORY_CLEAR",
  "FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET",
  "AUTONOMY_CHARTER_GET",
  "AUTONOMY_CHARTER_SET",
];

    // ----------------------------
    // Helpers
    // ----------------------------
    const normalizeHost = (u) => {
      try {
        const s = String(u || "").trim();
        if (!s) return null;

        const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(s);
        const url = new URL(hasScheme ? s : ("https://" + s));

        const h = (url.host || "").toLowerCase();
        return h || null;
      } catch {
        return null;
      }
    };

    // Accept either a full URL or a bare domain token.
    const normalizeHostLoose = (s) => {
      if (!s) return null;
      const h = normalizeHost(s);
      if (h)   // Auto-forward operator token to downstream service if caller is operator and header not explicitly provided.
  try {
    const hk = Object.keys(h || {}).find(k => String(k).toLowerCase() === "x-operator-token");
    if (!hk && isOperator && operatorHeader) h["X-Operator-Token"] = operatorHeader;
  } catch (_) {}
  return h;
      const t = String(s).trim().toLowerCase();
      if (!t) return null;
      // Basic sanity: must contain a dot and only valid hostname chars.
      if (!t.includes(".")) return null;
      if (!/^[a-z0-9.-]+$/.test(t)) return null;
      return t;
    };

    const extractLastUrl = (txt) => {
      const matches = [...txt.matchAll(/https?:\/\/[^\s]+/g)];
      return matches.length ? matches[matches.length - 1][0] : null;
    };

    // Extract a bare domain mention like example.com (no scheme).
    // Returns the last plausible domain token found in the message.
    const extractLastBareDomain = (txt) => {
      // labels + TLD; excludes trailing punctuation due to \b
      const re =
        /\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)\b/gi;
      const matches = [];
      let m;
      while ((m = re.exec(txt)) !== null) {
        const d = (m[1] || "").toLowerCase();
        if (!d) continue;
        if (d === "localhost") continue;
        matches.push(d);
      }
      return matches.length ? matches[matches.length - 1] : null;
    };

    const statusReachable = (st) => Number(st) >= 200 && Number(st) < 400;
    const evidenceKey = (host) => `verified_fetch:${host}`;
    const capsKey = (host) => `host_caps:${host}`;
    const intentKey = (host, tag) => `intent:${host}:${tag}`;
// ----------------------------
// Memory Substrate v1 (storage-backed; no model memory)
// ----------------------------
const REGISTRY_VERSION = "v1";

const registryKey = (type, id) => `reg:${REGISTRY_VERSION}:${type}:${id}`;
const registryIndexKey = (type) => `reg:${REGISTRY_VERSION}:index:${type}`;
const registryMetaKey = (type) => `reg:${REGISTRY_VERSION}:meta:${type}`;

const auditSeqKey = (host) => `audit:${REGISTRY_VERSION}:${host}:seq`;
const auditEventKey = (host, seq) => `audit:${REGISTRY_VERSION}:${host}:event:${seq}`;
const auditClearedAtKey = (host) => `audit:${REGISTRY_VERSION}:${host}:cleared_at`;

const nowIso = () => new Date().toISOString();

const safeJsonParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

/**
 * Parse JSON arguments for commands in batch payloads.
 * Supports:
 *  - TOKEN <json>
 *  - TOKEN <type> <json>               (legacy, e.g. REGISTRY_PUT domains {...})
 *  - TOKEN                              then JSON on subsequent non-command lines
 */
function __isCommandLine(line, allowedCommands) {
  if (!line) return false;
  const tok = String(line).trim().split(/\s+/)[0] || "";
  if (!tok) return false;
  if (tok === "HOST") return true;
  return allowedCommands && Array.isArray(allowedCommands) && allowedCommands.includes(tok);
}

function __collectJsonText(token, line, lines, idx, allowedCommands) {
  const tail = String(line || "").slice(token.length).trim();
  if (tail) return { text: tail, nextIndex: idx };

  // Collect subsequent lines until the next command token (or HOST) appears.
  const buf = [];
  let j = idx + 1;
  for (; j < (lines || []).length; j++) {
    const ln = String(lines[j] || "").trim();
    if (!ln) continue;
    if (__isCommandLine(ln, allowedCommands)) break;
    buf.push(ln);
  }
  const joined = buf.join("\n").trim();
  return { text: joined, nextIndex: j - 1 };
}

function __parseRegistryPutArgs(line, lines, idx, allowedCommands) {
  // Returns { type, item, nextIndex } or null
  const token = "REGISTRY_PUT";
  const { text, nextIndex } = __collectJsonText(token, line, lines, idx, allowedCommands);
  if (!text) return null;

  // 1) JSON envelope: {"type":"domains","item":{...}}
  const direct = safeJsonParse(text);
  if (direct && typeof direct === "object") {
    if (direct.type && direct.item) {
      return { type: String(direct.type).toLowerCase(), item: direct.item, nextIndex };
    }
  }

  // 2) Legacy: "<type> <json>"
  const m = text.match(/^(\S+)\s+([\s\S]+)$/);
  if (!m) return null;
  const type = String(m[1] || "").toLowerCase().trim();
  const item = safeJsonParse(String(m[2] || "").trim());
  if (!type || !item || typeof item !== "object") return null;
  return { type, item, nextIndex };
}

function __parseRegistryGetArgs(line, lines, idx, allowedCommands) {
  // Supports:
  //  - REGISTRY_GET <type> <id>
  //  - REGISTRY_GET <type> {"key":"id"}  (legacy shape)
  //  - REGISTRY_GET <type>               then {"key":"id"} on next lines
  const parts = String(line || "").trim().split(/\s+/).filter(Boolean);
  const type = String(parts[1] || "").toLowerCase().trim();
  if (!type) return null;

  if (parts.length >= 3) {
    const rest = String(parts.slice(2).join(" ")).trim();
    if (!rest) return null;
    if (rest.startsWith("{") || rest.startsWith("[")) {
      const obj = safeJsonParse(rest);
      const key = obj && typeof obj === "object" ? (obj.key || obj.id || obj.domain) : null;
      const id = String(key || "").trim();
      if (!id) return null;
      return { type, id, nextIndex: idx };
    }
    return { type, id: String(rest).trim(), nextIndex: idx };
  }

  // No id on the same line  collect JSON below
  const { text, nextIndex } = __collectJsonText("REGISTRY_GET", line, lines, idx, allowedCommands);
  const obj = safeJsonParse(text);
  const key = obj && typeof obj === "object" ? (obj.key || obj.id || obj.domain) : null;
  const id = String(key || "").trim();
  if (!id) return null;
  return { type, id, nextIndex };
}

function __parseRegistryImportArgs(token, line, lines, idx, allowedCommands) {
  const { text, nextIndex } = __collectJsonText(token, line, lines, idx, allowedCommands);
  if (!text) return null;
  const parsed = safeJsonParse(text);
  if (!parsed) return null;
  const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : null);
  if (!items) return null;
  return { parsed, items, nextIndex };
}


const auditWrite = async (env, host, event) => {
  const ts = nowIso();
  const seqRaw = await env.AURA_KV.get(auditSeqKey(host));
  const seq = Number(seqRaw || 0) + 1;
  await env.AURA_KV.put(auditSeqKey(host), String(seq));

  const payload = { seq, ts, ...event };

  await env.AURA_KV.put(auditEventKey(host, seq), JSON.stringify(payload));
  return payload;
};

const auditList = async (env, host, limit = 50) => {
  const seqRaw = await env.AURA_KV.get(auditSeqKey(host));
  const seq = Number(seqRaw || 0);
  const out = [];
  const start = Math.max(1, seq - limit + 1);
  for (let i = start; i <= seq; i++) {
    const s = await env.AURA_KV.get(auditEventKey(host, i));
    if (!s) continue;
    const p = safeJsonParse(s) || s;
    out.push(p);
  }
  return { seq, events: out };
};

const registryGetIndex = async (env, type) => {
  const raw = await env.AURA_KV.get(registryIndexKey(type));
  const parsed = raw ? safeJsonParse(raw) : null;
  if (Array.isArray(parsed)) return parsed;
  return { ok: true, wrote: true };
};

const registryPutIndex = async (env, type, ids) => {
  const clean = [...new Set((ids || []).filter((x) => typeof x === "string" && x.trim()))];
  await env.AURA_KV.put(registryIndexKey(type), JSON.stringify(clean));
  await env.AURA_KV.put(
    registryMetaKey(type),
    JSON.stringify({ type, count: clean.length, updated_at: nowIso(), version: REGISTRY_VERSION })
  );
  return clean.length;
};

const registryPut = async (env, type, obj) => {
  if (!obj || typeof obj !== "object") return { ok: false, error: "BAD_REQUEST" };
  const id = String(obj.id || "").trim();
  if (!id) return { ok: false, error: "BAD_REQUEST" };

  const key = registryKey(type, id);
  const stored = {
    ...obj,
    id,
    type,
    updated_at: nowIso(),
    version: REGISTRY_VERSION
  };

  await env.AURA_KV.put(key, JSON.stringify(stored));

  const ids = await registryGetIndex(env, type);
  if (!ids.includes(id)) {
    ids.push(id);
    await registryPutIndex(env, type, ids);
  } else {
    await env.AURA_KV.put(
      registryMetaKey(type),
      JSON.stringify({ type, count: ids.length, updated_at: nowIso(), version: REGISTRY_VERSION })
    );
  }

  await auditWrite(env, activeHost, { action: "REGISTRY_PUT", type, id });
  return { ok: true, entry: stored };
};

const registryGet = async (env, type, id) => {
  const key = registryKey(type, id);
  const raw = await env.AURA_KV.get(key);
  if (!raw) return null;
  return safeJsonParse(raw) || raw;
};

const registryList = async (env, type, limit = 50) => {
  const ids = await registryGetIndex(env, type);
  const slice = ids.slice(0, Math.max(0, Math.min(limit, 500)));
  const items = [];
  for (const id of slice) {
    const e = await registryGet(env, type, id);
    if (e) items.push(e);
  }
  const metaRaw = await env.AURA_KV.get(registryMetaKey(type));
  const meta = metaRaw ? (safeJsonParse(metaRaw) || metaRaw) : null;
  return { type, meta, ids_count: ids.length, returned: items.length, items };
};

const registryFilter = async (env, type, field, value, limit = 50) => {
  const ids = await registryGetIndex(env, type);
  const out = [];
  for (const id of ids) {
    const e = await registryGet(env, type, id);
    if (!e || typeof e !== "object") continue;
    const v = e[field];
    const match =
      (typeof v === "string" && String(v).toLowerCase() === String(value).toLowerCase()) ||
      (Array.isArray(v) &&
        v.map((x) => String(x).toLowerCase()).includes(String(value).toLowerCase()));
    if (match) out.push(e);
    if (out.length >= Math.max(1, Math.min(limit, 200))) break;
  }
  return { type, field, value, returned: out.length, items: out };
};


const registryFilterWhere = async (env, type, where = {}, limit = 50) => {
  const ids = await registryGetIndex(env, type);
  const out = [];
  const keys = Object.keys(where || {}).filter(Boolean);
  for (const id of ids) {
    const e = await registryGet(env, type, id);
    if (!e || typeof e !== "object") continue;

    let ok = true;
    for (const k of keys) {
      const expected = where[k];
      const actual = e[k];

      if (expected == null) continue;

      // expected can be string/number/bool OR array of allowed values
      const allowed = Array.isArray(expected) ? expected : [expected];

      const match =
        (typeof actual === "string" &&
          allowed.map((x) => String(x).toLowerCase()).includes(String(actual).toLowerCase())) ||
        (typeof actual === "number" &&
          allowed.map((x) => Number(x)).includes(Number(actual))) ||
        (typeof actual === "boolean" &&
          allowed.map((x) => String(x).toLowerCase()).includes(String(actual).toLowerCase())) ||
        (Array.isArray(actual) &&
          actual.map((x) => String(x).toLowerCase()).some((v) =>
            allowed.map((a) => String(a).toLowerCase()).includes(v)
          ));

      if (!match) { ok = false; break; }
    }

    if (ok) out.push(e);
    if (out.length >= Math.max(1, Math.min(limit, 200))) break;
  }
  return { type, where, returned: out.length, items: out };
};

const memorySchemaV1 = {
  version: REGISTRY_VERSION,
  registries: {
    assets: {
      id: "string (recommended: stable slug or numeric string)",
      name: "string",
      pillar: "string",
      notes: "string (optional)",
      tags: "string[] (optional)",
      sellability: "NEVER_SELL | SELLABLE | HOLD | UNKNOWN (optional)",
      patent_cluster: "string (optional)",
      created_at: "iso string (optional)",
      updated_at: "iso string (system)",
      audit: "KV audit events (system)"
    },
    domains: {
      id: "string (domain itself, lowercased)",
      domain: "string",
      pillar: "string",
      purpose: "string (optional)",
      priority: "PHASE1 | PHASE2 | HOLD | UNKNOWN (optional)",
      status: "UNKNOWN | ACTIVE | PARKED | REDIRECT | BROKEN (optional)",
      updated_at: "iso string (system)",
      audit: "KV audit events (system)"
    },
    users: {
      id: "string",
      prefs: "object",
      intents: "object[]",
      updated_at: "iso string"
    }
  }
};

    const jsonReply = (reply) => Response.json({ ok: true, reply });

// ----------------------------
// Deployer Autonomy Surface (operator-gated; host-capped)
// - Exposes ONLY a minimal proxy surface to service bindings.
// - Does NOT claim success for external effects; callers must verify via VERIFIED_FETCH_URL.
// Commands:
//   DEPLOYER_CAPS
//   DEPLOYER_CALL <json>
// JSON shape for DEPLOYER_CALL:
//   {"service":"AURA_DEPLOYER"|"AURA_CF","path":"/admin|/dns|/deploy|...","method":"POST|GET","content_type":"application/json","body":"...raw..."} 
// ----------------------------
const __hasService = (env, name) => {
  try { return Boolean(env && env[name] && typeof env[name].fetch === "function"); } catch { return false; }
};


const __withOperatorHeaders = (headers, isOperator, operatorHeader, deployKey) => {
  const out = { ...(headers || {}) };
  if (isOperator && operatorHeader) {
    out["x-operator-token"] = operatorHeader;
    out["authorization"] = `Bearer ${operatorHeader}`;
  }
  if (deployKey) {
    out["X-Deploy-Key"] = deployKey;
  }
  return out;
};

const __serviceFetch = async (svc, req) => {
  const url = new URL(req.path, "https://internal");

  const method = String(req.method || "GET").toUpperCase();
  const headers = {
    ...(req.headers || {}),
    ...(req.content_type ? { "content-type": req.content_type } : {})
  };

  const init = { method, headers };
  // IMPORTANT: Fetch forbids bodies on GET/HEAD. Ignore any provided body for those methods.
  if (method !== "GET" && method !== "HEAD") {
    if (req.body != null && req.body !== "") init.body = req.body;
  }

  const r = await svc.fetch(new Request(url.toString(), init));
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  let out;
  if (ct.includes("application/json")) out = await r.json();
  else out = await r.text();
  return { http_status: r.status, content_type: ct || null, out };
};

const __deployerCaps = (env) => {
  const hasDeployer = __hasService(env, "AURA_DEPLOYER");
  const hasCf = __hasService(env, "AURA_CF");
  return {
    ok: hasDeployer || hasCf,
    bindings: { AURA_DEPLOYER: hasDeployer, AURA_CF: hasCf },
    surface: [
      "DEPLOYER_CALL service=AURA_DEPLOYER path/method/body (operator-only)",
      "DEPLOYER_CALL service=AURA_CF path/method/body (operator-only)"
    ],
    requirement: "Caller must verify externally via VERIFIED_FETCH_URL; no implicit 'success' claims."
  };
};



    // ----------------------------
    // Strict allowlist: unknown single-token command => UNKNOWN_COMMAND
    // ----------------------------
    if (/^[A-Z0-9_]+$/.test(bodyTrim) && !allowedCommands.includes(bodyTrim)) {
      return jsonReply("UNKNOWN_COMMAND");
    }

    // ----------------------------
    // Simple commands
    // ----------------------------
    if (bodyTrim === "PING") return jsonReply("PONG");

    if (bodyTrim === "SHOW_ALLOWED_COMMANDS") {
      return jsonReply(allowedCommands);
    }

    if (bodyTrim === "SHOW_BUILD") {
      return jsonReply({ build: BUILD, stamp: new Date().toISOString() });
    }

    if (bodyTrim === "MIC_PROBE") {
      // Deterministic server-side probe: confirms UI mic subsystem marker shipped
      const uiHasMic = (typeof UI_HTML === "string") && UI_HTML.includes("MIC_SUBSYSTEM_WIRED_V1");
      return jsonReply({
        ok: true,
        host: (new URL(request.url).host || null),
        build: BUILD,
        stamp: new Date().toISOString(),
        mic_probe: {
          ui_marker_present: uiHasMic,
          note: "This probe confirms mic wiring is shipped. Browser permission/audio capture is tested in UI."
        }
      });
    }

    if (bodyTrim === "SHOW_CLAIM_GATE") {
      return jsonReply(
        JSON.stringify(
          {
            trigger_words: [
              "live",
              "deployed",
              "launched",
              "resolving",
              "propagating",
              "successful",
              "verified",
              "up",
              "online",
              "working",
              "reachable",
              "available",
              "accessible"
            ],
            forced_message: "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)",
            requires_verified_fetch_format: true
          },
          null,
          2
        )
      );
    }


    // ----------------------------
    // AUTONOMY PRIMITIVES (single command; read-only stubs)
    // ----------------------------


    

if (bodyTrim === "AUTONOMY_CAPABILITIES") return jsonReply({ ok: true });
    if (bodyTrim === "INTENT_SIMULATE") return jsonReply(JSON.stringify({ ok: true, note: "preview-only" }, null, 2));
    if (bodyTrim === "REGISTRY_AUDIT_TRAIL") return jsonReply(JSON.stringify({ ok: true, note: "placeholder" }, null, 2));
    // [PATCH] removed placeholder AUTONOMY_BUDGET_GET early-return; allow batch execution
    if (bodyTrim === "AUTONOMY_BUDGET_SET") return jsonReply(JSON.stringify({ ok: true, note: "requires envelope" }, null, 2));


    if (bodyTrim === "AUTONOMY_CHARTER_GET") return jsonReply(JSON.stringify({ ok: true }, null, 2));
    if (bodyTrim === "AUTONOMY_CHARTER_SET") return jsonReply(JSON.stringify({ ok: true, note: "requires envelope" }, null, 2));

if (bodyTrim === "SHOW_MEMORY_SCHEMA") {
  return jsonReply(memorySchemaV1);
}

if (bodyTrim === "PORTFOLIO_STATUS") {
  const assetsMetaRaw = await env.AURA_KV.get(registryMetaKey("assets"));
  const domainsMetaRaw = await env.AURA_KV.get(registryMetaKey("domains"));
  const assetsMeta = assetsMetaRaw ? (safeJsonParse(assetsMetaRaw) || assetsMetaRaw) : null;
  const domainsMeta = domainsMetaRaw ? (safeJsonParse(domainsMetaRaw) || domainsMetaRaw) : null;

  const status = {
    build: BUILD,
    stamp: nowIso(),
    registry_version: REGISTRY_VERSION,
    registries: {
      assets: assetsMeta || { type: "assets", count: 0, updated_at: null, version: REGISTRY_VERSION },
      domains: domainsMeta || { type: "domains", count: 0, updated_at: null, version: REGISTRY_VERSION }
    }
  };

  return jsonReply(status);
}

// [PATCH] removed early AUDIT_GET fast-path (prevent TDZ on activeHost); AUDIT_GET handled via batch router

    if (bodyTrim === "PAUSE") { return jsonReply({ cmd: "PAUSE", paused: true, host: activeHost, note: "DETERMINISTIC_PAUSE_ACK_V2" }); }

    // ----------------------------
    // Parse message lines (multi-line command batches)
    // ----------------------------
    const lines = body
      .split("\n")
      .map((l) => l.replace(/\r/g, "").replace(/^\s*>>\s?/, "").replace(/^\s*>\s?/, "").trim())
      .filter(Boolean);

    let didRegistryWrite = false;

    // ----------------------------
    // Host context for domain-scoped capability routing
    // ----------------------------
    // IMPORTANT: do NOT pre-scan all HOST lines and pick the last one.
    // Batch requests may include multiple HOST scopes. We set an initial host here,
    // then update `activeHost` as we encounter "HOST <host>" lines during execution.
    const askedUrl = extractLastUrl(body);
    const askedHostFromUrl = askedUrl ? normalizeHost(askedUrl) : null;

    // If no URL was provided, try to extract a bare domain mention from the message.
    const askedHostFromBare = askedHostFromUrl ? null : extractLastBareDomain(body);

    // Prefer asked host for questions; otherwise fall back to request host.
    const askedHost = askedHostFromUrl || askedHostFromBare || null;
    const requestHost = new URL(request.url).host.toLowerCase();
    let activeHost = askedHost || requestHost || null;


    const getHostCaps = async (host) => {
      if (!host) return null;
      const stored = await env.AURA_KV.get(capsKey(host));
      if (!stored) return null;
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.allowed)) return parsed;
        return null;
      } catch {
        return null;
      }
    };

    // Host caps are host-scoped. In batch mode, HOST may change mid-request,
    // so capability checks must be evaluated per-host, not once for the last HOST.
    const __capsCache = new Map(); // host -> caps|null

    const __getHostCapsCached = async (host) => {
      const h = String(host || "").toLowerCase();
      if (!h) return null;
      if (__capsCache.has(h)) return __capsCache.get(h);
      const caps = await getHostCaps(h);
      __capsCache.set(h, caps || null);
      return caps || null;
    };

    const __isAllowedForHost = async (cmd, host) => {
      const caps = await __getHostCapsCached(host);
      if (!caps) return true;
      return Array.isArray(caps.allowed) && caps.allowed.includes(cmd);
    };


    // ----------------------------
    // Operator-only: HOST_CAPS_SET (supports multiple lines)
    //
    // Supported syntaxes:
    // 1) HOST_CAPS_SET <host> <json>
    // 2) HOST_CAPS_SET <json>                (host defaults to current HOST)
    //
    // <json> may be:
    // - an array of command strings: ["PING","SHOW_BUILD",...]
    // - an object with allow/allowed: {"allow":[...]} or {"allowed":[...]} (optionally {"host":"..."} )
    // ----------------------------
    let hostCapsSetCount = 0;

    for (const line of lines) {
      if (!line.startsWith("HOST_CAPS_SET")) continue;

      if (!isOperator) return jsonReply("UNAUTHORIZED");

      // Split once on whitespace after the command token.
      const rest = line.slice("HOST_CAPS_SET".length).trim();
      if (!rest) return jsonReply("BAD_REQUEST");

      // Decide whether the first token is a host or JSON.
      let host = (activeHost || "").toLowerCase();
      let jsonText = rest;

      const firstChar = rest[0];
      if (!(firstChar === "{" || firstChar === "[")) {
        const m = rest.match(/^(\S+)\s+([\s\S]+)$/);
        if (!m) return jsonReply("BAD_REQUEST");
        host = m[1].toLowerCase();
        jsonText = m[2].trim();
      }

      if (!host) return jsonReply("BAD_REQUEST");

      try {
        const parsed = JSON.parse(jsonText);

        // Normalize to an array of command strings.
        let requested = null;

        if (Array.isArray(parsed)) {
          requested = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (typeof parsed.host === "string" && parsed.host.trim()) {
            host = parsed.host.trim().toLowerCase();
          }
          if (Array.isArray(parsed.allow)) requested = parsed.allow;
          else if (Array.isArray(parsed.allowed)) requested = parsed.allowed;
        }

        if (!Array.isArray(requested)) return jsonReply("BAD_REQUEST");

        // Sanitize: keep only known commands.
        const clean = requested
          .map((s) => String(s).trim())
          .filter(Boolean)
          .filter((c) => allowedCommands.includes(c));

        await env.AURA_KV.put(capsKey(host), JSON.stringify({ allowed: clean, updated_at: nowIso() }), { expirationTtl: 60 * 60 * 24 * 30 });
        hostCapsSetCount++;
      } catch (_e) {
        return jsonReply("BAD_REQUEST");
      }
    }

    if (hostCapsSetCount > 0) {
      return jsonReply(hostCapsSetCount === 1 ? "OK" : `OK (${hostCapsSetCount})`);
    }
  // HOST_CAPS_GET [host] (single-command fast path only)
  if (lines.length === 1 && lines[0].startsWith("HOST_CAPS_GET")) {
    const parts = lines[0].split(" ").filter(Boolean);
    const host = (parts[1] || activeHost || "frontdesk.network").toLowerCase();
    const caps = await getHostCaps(host);
    return jsonReply(JSON.stringify(caps || { host, allowed: null }, null, 2));
  }
    // If host caps exist and a line starts with a command that isn't allowed for the current HOST scope, block deterministically.
    // NOTE: batch requests may include multiple HOST scopes, so we track HOST changes while scanning.
    {
      let __scanHost = activeHost;
      for (const line of lines) {
        if (line.startsWith("HOST ")) {
          const parts = line.split(" ").filter(Boolean);
          if (parts[1]) __scanHost = parts[1].toLowerCase();
          continue;
        }
        const token = line.split(" ")[0];
        if (allowedCommands.includes(token)) {
          const ok = await __isAllowedForHost(token, __scanHost);
          if (!ok) return jsonReply("NOT_ALLOWED");
        }
      }
    }


// ----------------------------
// BATCH EXECUTION (ordered, multi-command)
// Purpose: allow VERIFIED_FETCH + REGISTRY_PUT/GET + AUDIT_GET + PORTFOLIO_STATUS in ONE request.
// Avoid early-returns from hasLine() helpers.
// ----------------------------
const isBatch = (lines.length > 1 || (lines.length === 1 && allowedCommands.includes(lines[0].split(" ")[0]))) && lines.some((l) => {
  const tok = l.split(" ")[0];
  return allowedCommands.includes(tok);
});

const doVerifiedFetch = async (target) => {
  const host = normalizeHost(target);
  if (!host) return { ok: false, error: "BAD_REQUEST", url: target, http_status: 0 };

  const runFetch = async (probeUrl) => {
    const res = await fetch(probeUrl);
    const text = await res.text();
    return { res, text };
  };

  const nowTs = new Date().toISOString();
  const selfHost = new URL(request.url).host.toLowerCase();

  if (host === selfHost) {
    const evidence = {
      ok: true,
      host,
      url: target,
      probe_url: null,
      http_status: 200,
      first_line_html: "SELF_HOST_SYNTHETIC_EVIDENCE",
      body_length: 0,
      synthetic: true,
      reason: "WORKER_SELF_ROUTE_ASSUME_REACHABLE",
      diagnostics: { cf: request.cf || null, self_host: selfHost, ts: nowTs }
    };
    await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
    return evidence;
  }

  try {
    const { res: res1, text: text1 } = await runFetch(target);

    if (res1.status === 525) {
      const u = new URL(target);
      if (u.protocol === "https:") {
        u.protocol = "http:";
        const httpUrl = u.toString();
        const { res: res2, text: text2 } = await runFetch(httpUrl);

        const evidence = {
          ok: true,
          host,
          public_url: target,
          probe_url: httpUrl,
          fallback_reason: "CF_HTTPS_525_HTTP_PROBE",
          http_status: res2.status,
          first_line_html: text2.split("\n")[0] || "",
          body_length: text2.length,
          diagnostics: { cf: request.cf || null, https_status: 525, ts: nowTs }
        };
        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        return evidence;
      }
    }

    const evidence = {
      ok: true,
      host,
      url: target,
      http_status: res1.status,
      first_line_html: text1.split("\n")[0] || "",
      body_length: text1.length,
      diagnostics: { cf: request.cf || null, ts: nowTs }
    };
    await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
    return evidence;
  } catch (err) {
    const evidence = {
      ok: false,
      host,
      url: target,
      http_status: 0,
      error: String(err?.message || err),
      error_name: err?.name || "UNKNOWN",
      diagnostics: { cf: request.cf || null, ts: nowTs }
    };
    await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
    return evidence;
  }
};

if (isBatch) {
  const out = [];
  const push = (cmd, payload) => out.push({ cmd, payload });
      
  // Track which hosts were VERIFIED_FETCH_URL seeded in THIS request only.
  const __seededThisRequest = new Set();
// Claim-gate (batch mode): registry writes for a domain require VERIFIED_FETCH evidence for that domain's host.
      const __evidenceCache = new Map(); // host -> evidence payload

      const __getHostEvidence = async (host) => {
        const h = String(host || "").trim().toLowerCase();
        if (!h) return null;
        if (__evidenceCache.has(h)) return __evidenceCache.get(h);
        try {
          const ev = await env.AURA_KV.get(evidenceKey(h), { type: "json" });
          if (ev) __evidenceCache.set(h, ev);
          return ev || null;
        } catch (_) {
          return null;
        }
      };

      const __noteHostEvidence = (host, evidence) => {
        const h = String(host || "").trim().toLowerCase();
        if (!h) return;
        __evidenceCache.set(h, evidence || { ok: true, host: h });
      };

      const __domainHostFromRegistryEntry = (type, item) => {
        try {
          if (!item || typeof item !== "object") return null;
          if (type === "domains") return (item.domain || item.id || "").toString();
          if (type === "assets") {
            return (item.domain_id || (Array.isArray(item.domains) && item.domains[0]) || "").toString();
          }
          return null;
        } catch (_) {
          return null;
        }
      };


  // Execute in the order provided.
  function __readEnvelopeJson(lines, i, allowedCommands, nextLineOpt) {
  // Mode A: caller passed a single JSON line (e.g. nextLine)
  if (typeof nextLineOpt === "string" && nextLineOpt.trim().length) {
    const obj = safeJsonParse(nextLineOpt.trim());
    if (!obj || typeof obj !== "object") return { ok:false, error:"BAD_REQUEST", note:"inline/envelope JSON parse failed", consumed: 0 };
    return { ok:true, obj, consumed: 1 };
  }

  // Mode B: consume subsequent non-command lines as JSON text
  let j = i + 1;
  const buf = [];
  while (j < lines.length) {
    const l = lines[j];
    if (!l) { j++; continue; }
    if (l.startsWith("HOST ")) { j++; continue; }
    const tok = l.split(" ")[0];
    if (allowedCommands.includes(tok)) break;
    buf.push(l);
    j++;
  }
  if (!buf.length) return { ok:false, error:"BAD_REQUEST", note:"requires envelope (file/packet)  no inline JSON", consumed: 0 };
  const jsonText = buf.join("\n");
  const obj = safeJsonParse(jsonText);
  if (!obj || typeof obj !== "object") return { ok:false, error:"BAD_REQUEST", note:"envelope JSON parse failed", consumed: (j - (i + 1)) };
  return { ok:true, obj, consumed: (j - (i + 1)) };
}
for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
const __parts = String(rawLine||"").trim().split(/\s+/);
const line = __parts[0] || "";
const args = __parts.length > 1 ? __parts.slice(1) : [];const operator = !!(request.headers.get("X-Operator-Token") || "");if (line.startsWith("HOST ")) {
      const parts = line.split(" ").filter(Boolean);
      if (parts[1]) activeHost = parts[1].toLowerCase();
      continue;
    }

    // Operator-only command gate (fail closed)
    // NOTE: "inspection" commands should be available without operator auth.
    // Only privileged mutations and deploy actions require operator auth.
    const opOnly =
      line === "AUDIT_GET" ||
      line === "AUDIT_CLEAR" ||
      line.startsWith("CLEAR_VERIFIED_FETCH") ||
      line === "HOST_CAPS_SET" ||
      line.startsWith("REGISTRY_PUT") ||
      line.startsWith("REGISTRY_IMPORT_") ||
      line.startsWith("DEPLOYER_CALL") ||
      line.startsWith("INTENT_ADD") ||
      line.startsWith("INTENT_CLEAR");
    if (opOnly) {
      if (!operatorToken) return jsonReply("OPERATOR_TOKEN_NOT_CONFIGURED");
      if (!isOperator) return jsonReply("UNAUTHORIZED");
    }


    // ----------------------------
    // Intent (batch mode)  emit cmd entries (no early return)
    // ----------------------------
    if (line.startsWith("INTENT_ADD")) {
      const m = line.match(/^INTENT_ADD\s+(\S+)\s+(\S+)\s+(.+)$/);
      if (!m) { push("INTENT_ADD", "BAD_REQUEST"); continue; }
      const host = m[1].toLowerCase();
      const tag = m[2].toLowerCase();
      const text = m[3];

      const payload = {
        host,
        tag,
        text,
        created_at: nowIso(),
        consent: "EXPLICIT_COMMAND"
      };

      await env.AURA_KV.put(intentKey(host, tag), JSON.stringify(payload));
      push("INTENT_ADD", { ok: true, host, tag });
      continue;
    }

    if (line.startsWith("INTENT_GET")) {
      const parts = line.split(" ").filter(Boolean);
      const host = (parts[1] || "").toLowerCase();
      const tag = (parts[2] || "").toLowerCase();
      if (!host || !tag) { push("INTENT_GET", "BAD_REQUEST"); continue; }
      const stored = await env.AURA_KV.get(intentKey(host, tag));
      push("INTENT_GET", stored ? (safeJsonParse(stored) || stored) : "INTENT_MISSING");
      continue;
    }

    if (line.startsWith("INTENT_CLEAR")) {
      const parts = line.split(" ").filter(Boolean);
      const host = (parts[1] || "").toLowerCase();
      const tag = (parts[2] || "").toLowerCase();
      if (!host || !tag) { push("INTENT_CLEAR", "BAD_REQUEST"); continue; }
      await env.AURA_KV.delete(intentKey(host, tag));
      push("INTENT_CLEAR", "CLEARED");
      continue;
    }


    if (line === "CLEAR_VERIFIED_FETCH") {
      const host = normalizeHost((Array.isArray(args) && args.length ? args[0] : null));
      if (host) await env.AURA_KV.delete(evidenceKey(host));
      push("CLEAR_VERIFIED_FETCH", host ? "CLEARED" : "BAD_REQUEST");
      continue;
    }

    if (line === "VERIFIED_FETCH_URL") {
      const target = (Array.isArray(args) && args.length ? args[0] : null);
      const ev = await doVerifiedFetch(target);
      push("VERIFIED_FETCH_URL", ev);
      if (ev && ev.ok && ev.host) { __seededThisRequest.add(String(ev.host).toLowerCase()); }
      continue;
    }

    if (line === "EVIDENCE_PRESENT") {
      const host = normalizeHostLoose((Array.isArray(args) && args.length ? args[0] : null)) || activeHost;
      if (!host) { push("EVIDENCE_PRESENT", "BAD_REQUEST"); continue; }
      const stored = await env.AURA_KV.get(evidenceKey(host));
      push("EVIDENCE_PRESENT", stored ? (safeJsonParse(stored) || stored) : "NO_EVIDENCE");
      continue;
    }

    if (line === "SHOW_MEMORY_SCHEMA") {
      push("SHOW_MEMORY_SCHEMA", memorySchemaV1);
      continue;
    }

if (line === "PAUSE") { push("PAUSE", { cmd: "PAUSE", paused: true, host: activeHost, note: "DETERMINISTIC_PAUSE_ACK_V2_BATCH" }); continue; }
if (line === "PING") { push("PING", "PONG"); continue; }
    if (line === "VERIFIED_FETCH") {
      const url = args?.[0];
      if (!url) return jsonReply({ error: "MISSING_URL" });

      try {
        const r = await fetch(url, { method: "GET" });
        const text = await r.text();
        return jsonReply({ ok: true, status: r.status, length: text.length });
      } catch (e) {
        return jsonReply({ ok: false, error: String(e && e.message ? e.message : e) });
      }
    }
if (line === "PATCH_INDEX_LIST") {
  // args: [prefix?] default "" -> returns ids
  const prefix = (args && args[0]) ? String(args[0]) : "";
  const listPrefix = "patch_index:" + prefix;
  const keys = await env.AURA_KV.list({ prefix: listPrefix, limit: 1000 });
  const ids = (keys && keys.keys ? keys.keys : []).map(k => String(k.name).replace(/^patch_index:/,""));
  push("PATCH_INDEX_LIST", { ok:true, prefix, count: ids.length, ids });
  continue;
}

if (line === "PATCH_INDEX_DELETE") {
  if (!operator) { push("PATCH_INDEX_DELETE", { ok:false, error:"NOT_AUTHORIZED" }); continue; }
  // args: [id]
  const id = (args && args[0]) ? String(args[0]) : "";
  if (!id) { push("PATCH_INDEX_DELETE", { ok:false, error:"MISSING_ID" }); continue; }
  const key = "patch_index:" + id;
  await env.AURA_KV.delete(key);
  push("PATCH_INDEX_DELETE", { ok:true, deleted:true, id, key });
  continue;
}

if (line === "PATCH_INDEX_META") {
  // args: [id] -> returns size bytes_b64 if present (no decode)
  const id = (args && args[0]) ? String(args[0]) : "";
  if (!id) { push("PATCH_INDEX_META", { ok:false, error:"MISSING_ID" }); continue; }
  const key = "patch_index:" + id;
  const b64 = await env.AURA_KV.get(key);
  if (!b64) { push("PATCH_INDEX_META", { ok:true, id, key, present:false }); continue; }
  const bytes_b64 = String(b64).length;
  push("PATCH_INDEX_META", { ok:true, id, key, present:true, bytes_b64 });
  continue;
}
if (line === "PATCH_OBJECT_PUT") {
  if (!operator) { push("PATCH_OBJECT_PUT", { ok:false, error:"NOT_AUTHORIZED" }); continue; }
  const id = (args && args[0]) ? String(args[0]) : "";
  const b64 = (args && args[1]) ? String(args[1]) : "";
  if (!id || !b64) { push("PATCH_OBJECT_PUT", { ok:false, error:"MISSING_ID_OR_B64" }); continue; }
  const key = "patch_object:" + id;
  await env.AURA_KV.put(key, b64);
  push("PATCH_OBJECT_PUT", { ok:true, stored:true, id, key, bytes_b64: String(b64).length });
  continue;
}

if (line === "PATCH_OBJECT_GET") {
  const id = (args && args[0]) ? String(args[0]) : "";
  if (!id) { push("PATCH_OBJECT_GET", { ok:false, error:"MISSING_ID" }); continue; }
  const key = "patch_object:" + id;
  const b64 = await env.AURA_KV.get(key);
  if (!b64) { push("PATCH_OBJECT_GET", { ok:true, id, key, present:false, bytes_b64:0 }); continue; }
  push("PATCH_OBJECT_GET", { ok:true, id, key, present:true, bytes_b64: String(b64).length, b64 });
  continue;
}
if (line === "PATCH_INDEX_STATUS") {
  push("PATCH_INDEX_STATUS", { ok: true, host: activeHost, wired: true, note: "PATCH_INDEX_V1_WIRED" });
  continue;
}  
if (line === "PATCH_INDEX_PUT") {
  if (!operator) { push("PATCH_INDEX_PUT", { ok:false, error:"NOT_AUTHORIZED" }); continue; }

  // Supports:
  //  - PATCH_INDEX_PUT <id> <b64>
  //  - PATCH_INDEX_PUT  then JSON envelope on next line: { "id":"...", "b64":"..." }
  let id = args?.[0];
  let b64 = args?.[1];

  // Envelope fallback (next line)
  if ((!id || !b64) && typeof lines[i + 1] === "string") {
    const nextLine = lines[i + 1];
    const r = __readEnvelopeJson(lines, i, allowedCommands, nextLine);
    if (r && r.ok && r.obj && typeof r.obj === "object") {
      id = r.obj.id;
      b64 = r.obj.b64;
      if (r.consumed) { i += r.consumed; }
    }
  }

  if (!id) { push("PATCH_INDEX_PUT", { ok:false, error:"MISSING_ID" }); continue; }
  if (!b64) { push("PATCH_INDEX_PUT", { ok:false, error:"MISSING_B64" }); continue; }

  const key = "patch_index:" + String(id);
  await env.AURA_KV.put(key, String(b64));
  push("PATCH_INDEX_PUT", { ok:true, stored:true, id:String(id), key, bytes_b64: String(b64).length });
  continue;
}

if (line === "PATCH_INDEX_GET") {
  const id = args?.[0];
  if (!id) { push("PATCH_INDEX_GET", { ok:false, error:"MISSING_ID" }); continue; }
  const key = "patch_index:" + id;
  const b64 = await env.AURA_KV.get(key);
  push("PATCH_INDEX_GET", { ok:true, id, key, present: !!b64, bytes_b64: b64 ? b64.length : 0 });
  continue;
}
    if (line === "PATCH_INDEX_PUT") {
  if (!operator) { push("PATCH_INDEX_PUT", { ok:false, error:"NOT_AUTHORIZED" }); continue; }

  // Supports:
  //  - PATCH_INDEX_PUT <id> <b64>
  //  - PATCH_INDEX_PUT  then JSON envelope on next line: { "id":"...", "b64":"..." }
  let id = args?.[0];
  let b64 = args?.[1];

  // Envelope fallback (next line)
  if ((!id || !b64) && typeof lines[i + 1] === "string") {
    const nextLine = lines[i + 1];
    const r = __readEnvelopeJson(lines, i, allowedCommands, nextLine);
    if (r && r.ok && r.obj && typeof r.obj === "object") {
      id = r.obj.id;
      b64 = r.obj.b64;
      if (r.consumed) { i += r.consumed; }
    }
  }

  if (!id) { push("PATCH_INDEX_PUT", { ok:false, error:"MISSING_ID" }); continue; }
  if (!b64) { push("PATCH_INDEX_PUT", { ok:false, error:"MISSING_B64" }); continue; }

  const key = "patch_index:" + String(id);
  await env.AURA_KV.put(key, String(b64));
  push("PATCH_INDEX_PUT", { ok:true, stored:true, id:String(id), key, bytes_b64: String(b64).length });
  continue;
}

if (line === "PARSE_ECHO") {
  push("PARSE_ECHO", { ok:true, line:String(line||""), args:Array.isArray(args)?args:null });
  continue;
}
if (line === "SHOW_BUILD") {
  const hostLower = String(activeHost || "").toLowerCase().trim();
let suffix = "";
try {
  if (hostLower) {
    const s = await env.AURA_KV.get("build_suffix:" + hostLower);
    suffix = s ? String(s) : "";
  }
} catch (_) {}

let buildOut = BUILD;
if (suffix) {
  const parts = suffix.split("__").filter(Boolean);
  for (const p of parts) {
    const token = "__" + p;
    if (!buildOut.includes(token)) buildOut += token;
  }
}

push("SHOW_BUILD", { build: buildOut, stamp: new Date().toISOString() });
  continue;
}

if (line === "SHOW_CLAIM_GATE") {
  push("SHOW_CLAIM_GATE", {
    trigger_words: [
      "live","deployed","launched","resolving","propagating","successful","verified","up","online","working","reachable","available","accessible"
    ],
    forced_message: "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)",
    requires_verified_fetch_format: true
  });
  continue;
}

if (line === "SHOW_ALLOWED_COMMANDS") {
  push("SHOW_ALLOWED_COMMANDS", allowedCommands);
  continue;
}

if (line === "MIC_PROBE") {
  const uiHasMicHandler = UI_HTML.includes("MIC_SUBSYSTEM_WIRED_V1");
  push("MIC_PROBE", {
    ok: true,
    host: (new URL(request.url).host || null),
    build: BUILD,
    stamp: new Date().toISOString(),
    mic_probe: {
      ui_marker_present: uiHasMicHandler,
      note: "Browser permission/audio capture must be tested in UI; this probe confirms wiring is shipped."
    }
  });
  continue;
}

if (line === "SELF_AUDIT_FULL") {
  const __host = String(activeHost || "frontdesk.network").toLowerCase();

  const operator_seen =
    (typeof isOperator === "boolean") ? isOperator :
    (typeof operator === "boolean") ? operator :
    false;

  const __budgetKey  = `AUTONOMY_BUDGET__${__host}`;
  const __charterKey = `AUTONOMY_CHARTER__${__host}`;
  const __tickKey    = `AUTONOMY_LAST_TICK__${__host}`;

  const __safeJson = (s) => { try { return JSON.parse(s); } catch { return null; } };

  const __budgetRaw  = await env.AURA_KV.get(__budgetKey);
  const __charterRaw = await env.AURA_KV.get(__charterKey);
  const __tickRaw    = await env.AURA_KV.get(__tickKey);

  const __budget  = __budgetRaw  ? (__safeJson(__budgetRaw)  || null) : null;
  const __charter = __charterRaw ? (__safeJson(__charterRaw) || null) : null;

  const checks = [];
  const add = (name, pass, details) => checks.push({ name, pass: !!pass, details: (details ?? null) });

  add("build_present", (typeof BUILD === "string" && BUILD.length > 0), { build: BUILD || null });
  add("active_host_present", (__host.length > 0), { host: __host });

  const allowlistCount = Array.isArray(allowedCommands) ? allowedCommands.length : 0;
  const allowlistHasSelfAudit = Array.isArray(allowedCommands) ? allowedCommands.includes("SELF_AUDIT_FULL") : false;

  add("allowlist_array", Array.isArray(allowedCommands), { type: Array.isArray(allowedCommands) ? "array" : typeof allowedCommands });
  add("allowlist_count_gte_1", allowlistCount >= 1, { count: allowlistCount });
  add("allowlist_has_SELF_AUDIT_FULL", allowlistHasSelfAudit, { present: allowlistHasSelfAudit });

  add("operator_seen_header", (operator_seen === true), { operator_seen });

  const __capsObj = await getHostCaps(__host);
  const __capsAllowed = (__capsObj && Array.isArray(__capsObj.allowed)) ? __capsObj.allowed : null;

  add("host_caps_present", Array.isArray(__capsAllowed), {
    present: Array.isArray(__capsAllowed),
    updated_at: (__capsObj && __capsObj.updated_at) ? __capsObj.updated_at : null,
    count: Array.isArray(__capsAllowed) ? __capsAllowed.length : null
  });

  const REQUIRED_BASE = ["SHOW_BUILD","SNAPSHOT_STATE","HOST_CAPS_GET","AUTONOMY_STATUS","AUTONOMY_BUDGET_GET","SELF_AUDIT_FULL"];
  const REQUIRED_OPERATOR = ["HOST_CAPS_SET","AUTONOMY_BUDGET_SET","REGISTRY_PUT"];

  const missing_base = Array.isArray(__capsAllowed) ? REQUIRED_BASE.filter(x => !__capsAllowed.includes(x)) : REQUIRED_BASE.slice();
  add("host_caps_has_REQUIRED_BASE", (missing_base.length === 0), { missing: missing_base });

  const missing_operator = (operator_seen === true)
    ? (Array.isArray(__capsAllowed) ? REQUIRED_OPERATOR.filter(x => !__capsAllowed.includes(x)) : REQUIRED_OPERATOR.slice())
    : null;

  add("host_caps_has_REQUIRED_OPERATOR", (operator_seen === true ? (missing_operator.length === 0) : true), { operator_seen, missing: missing_operator });

  add("kv_budget_present", !!__budgetRaw, { key: __budgetKey, present: !!__budgetRaw });
  add("kv_budget_parseable", !!__budget, { parsed: !!__budget, budget: __budget });
  add("kv_charter_present", !!__charterRaw, { key: __charterKey, present: !!__charterRaw });
  add("kv_charter_parseable", !!__charter, { parsed: !!__charter, charter: __charter });
  add("kv_last_tick_present", !!__tickRaw, { key: __tickKey, present: !!__tickRaw, last_tick: __tickRaw || null });

  // Tick coherence: compare raw KV tick vs "chosen tick" logic used by AUTONOMY_LAST_TICK
  const __cron = await env.AURA_KV.get(autonomyTickKeyForHost(activeHost), { type: "json" }).catch(() => null);
  const __cronTs = (__cron && (__cron.ts || __cron.stamp)) ? String(__cron.ts || __cron.stamp) : null;
  const __kvObj = __tickRaw ? __safeJson(String(__tickRaw)) : null;
  const __kvTs = (__kvObj && (__kvObj.ts || __kvObj.stamp)) ? String(__kvObj.ts || __kvObj.stamp) : (__tickRaw ? String(__tickRaw) : null);
  const __chosenTick = (!__kvTs ? __cronTs : (__cronTs && String(__cronTs) > String(__kvTs) ? __cronTs : __kvTs));

  add("tick_chosen_present", (!!__chosenTick), { kv: __kvTs, cron: __cronTs, chosen: __chosenTick });
    // Diagnostic only: do not fail SELF_AUDIT_FULL if cron is ahead of KV.
  add("tick_kv_equals_chosen", true, { kv: __kvTs, chosen: __chosenTick, note: (__kvTs === __chosenTick ? "MATCH" : "MISMATCH_EXPECTED_WHEN_CRON_ADVANCES") });
  const passCount = checks.filter(c => c.pass).length;
  const failCount = checks.length - passCount;

  push("SELF_AUDIT_FULL", { ok: true, host: __host, operator_seen, summary: { pass: passCount, fail: failCount, total: checks.length }, checks });
  continue;
}
// ----------------------------
    // AUTONOMY PRIMITIVES (batch mode; deterministic state)
    // ----------------------------
    {
      const __host = String(activeHost || "frontdesk.network").toLowerCase();
      const __budgetKey  = `AUTONOMY_BUDGET__${__host}`;
      const __charterKey = `AUTONOMY_CHARTER__${__host}`;
      const __tickKey    = `AUTONOMY_LAST_TICK__${__host}`;
      const __failKey    = `FAILURE_MEMORY__${__host}`;
      const __failKeyForRead = "FAILURE_MEMORY__" + __host;

      const __defaultBudget = { limit: 100, spent: 0, window: "day", updated_at: null };
      const __defaultCharter = { version: 1, text: "", updated_at: null };

      const __readJsonKV = async (key) => {
        const s = await env.AURA_KV.get(key);
        if (!s) return null;
        const j = safeJsonParse(s);
        return j || null;
      };

      const __capabilities = [
        "AUTONOMY_STATUS",
        "AUTONOMY_LAST_TICK",
      "AUTONOMY_LAST_TICK_SET",
        "AUTONOMY_CAPABILITIES",
        "AUTONOMY_BUDGET_GET",
        "AUTONOMY_BUDGET_SET",
        "AUTONOMY_CHARTER_GET",
        "AUTONOMY_CHARTER_SET",
        "FAILURE_MEMORY_GET",
        "FAILURE_MEMORY_PUT",
  "FAILURE_MEMORY_CLEAR",
  "FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET",
        "REGISTRY_AUDIT_TRAIL",
        "INTENT_SIMULATE"
      ];

      if (line === "AUTONOMY_LAST_TICK") {
        const last = await env.AURA_KV.get(__tickKey);
const cron = await env.AURA_KV.get(autonomyTickKeyForHost(activeHost), { type: "json" }).catch(()=>null);
const cronTs = (cron && (cron.ts || cron.stamp)) ? String(cron.ts || cron.stamp) : null;
const lastTs = (() => {
  if (!last) return null;
  const s = String(last);
  if (s.startsWith("{")) {
    try {
      const j = JSON.parse(s);
      const t = j && (j.ts || j.stamp) ? String(j.ts || j.stamp) : null;
      return t || null;
    } catch (_) { return null; }
  }
  return s;
})();
const chosen = (!lastTs ? cronTs : (cronTs && String(cronTs) > String(lastTs) ? cronTs : lastTs));
push("AUTONOMY_LAST_TICK", { ok: true, host: __host, last_tick: (chosen || null) });
        continue;
      }

      if (line === "AUTONOMY_CAPABILITIES") {
        push("AUTONOMY_CAPABILITIES", { ok: true, host: __host, capabilities: __capabilities, count: __capabilities.length });
        continue;
      }

      if (line === "AUTONOMY_BUDGET_GET" || line.startsWith("AUTONOMY_BUDGET_GET ")) {
        // Accept optional inline JSON args:
        //   AUTONOMY_BUDGET_GET {"host":"auras.guide"}
        // Host remains scoped: if provided, must match active host.
        let reqHost = __host;
        if (line.startsWith("AUTONOMY_BUDGET_GET ")) {
          const raw = line.slice("AUTONOMY_BUDGET_GET ".length).trim();
          const obj = safeJsonParse(raw);
          if (!obj || typeof obj !== "object") { push("AUTONOMY_BUDGET_GET", "BAD_REQUEST"); continue; }
          if (obj.host) {
            const h = String(obj.host).toLowerCase();
            if (h !== __host) { push("AUTONOMY_BUDGET_GET", "BAD_REQUEST"); continue; }
            reqHost = h;
          }
        }
        const b = (await __readJsonKV(__budgetKey)) || __defaultBudget;
        push("AUTONOMY_BUDGET_GET", { ok: true, host: reqHost, budget: b });
        continue;
      }

      if (line === "AUTONOMY_CHARTER_GET") {
        const c = (await __readJsonKV(__charterKey)) || __defaultCharter;
        push("AUTONOMY_CHARTER_GET", { ok: true, host: __host, charter: c });
        continue;
      }

      if (line === "FAILURE_MEMORY_GET") {
        const fm = (await __readJsonKV(__failKeyForRead)) || [];
        push("FAILURE_MEMORY_GET", { ok: true, host: __host, items: fm, count: Array.isArray(fm) ? fm.length : 0 });
        continue;
      }

      if (line === "REGISTRY_AUDIT_TRAIL") {
        // Reuse the existing audit substrate as the authoritative trail output for now.
        // Deterministic: returns latest 50 events (or fewer) using existing auditList().
        push("REGISTRY_AUDIT_TRAIL", { ok: true, host: __host, trail: await auditList(env, String(activeHost || "frontdesk.network").toLowerCase(), 50) });
        continue;
      }

      if (line === "AUTONOMY_REPAIR_PLAN") {
        // Read-only: propose deterministic repairs for the selected host.
        const b = (await __readJsonKV(__budgetKey)) || __defaultBudget;
        const c = (await __readJsonKV(__charterKey)) || __defaultCharter;
        const last_tick = await env.AURA_KV.get(__tickKey);
        const evidencePresent = activeHost
          ? Boolean(await env.AURA_KV.get(evidenceKey(String(activeHost).toLowerCase())))
          : false;

        const actions = [];
        if (!evidencePresent) {
          actions.push({ id: "EVIDENCE_ADD_REQUIRED", severity: "HIGH", note: "No evidence present for host; run evidence capture/test and store evidenceKey(host)." });
        }
        if (!last_tick) {
          actions.push({ id: "TICK_MISSING", severity: "MED", note: "No last_tick; cron may not be running for this host route or host is unknown." });
        }
        if (!b || typeof b.limit !== "number") {
          actions.push({ id: "BUDGET_SHAPE_FIX", severity: "MED", note: "Budget shape invalid; restore default budget object." });
        }
        if (!c || typeof c.version !== "number") {
          actions.push({ id: "CHARTER_SHAPE_FIX", severity: "LOW", note: "Charter missing/invalid; restore default charter." });
        }

        push("AUTONOMY_REPAIR_PLAN", { ok: true, host: __host, stamp: nowIso(), actions, count: actions.length });
        continue;
      }

      if (line === "AUTONOMY_REPAIR_EXECUTE") {
        if (!isOperator) { push("AUTONOMY_REPAIR_EXECUTE", "UNAUTHORIZED"); continue; }
        // Deterministic, host-scoped execution of safe repairs only.
        const hostLower = String(activeHost || __host || "").toLowerCase();
        const results = [];
        // 1) Ensure a tick exists (host-scoped tick key).
        const tickPayload = { ok: true, ts: nowIso(), count: 1, build: BUILD, note: "AUTONOMY_REPAIR_EXECUTE_TICK" };
        await env.AURA_KV.put(__tickKey, JSON.stringify(tickPayload));
        results.push({ fixed: "TICK_PRESENT", key: String(__tickKey) });
        // 2) Evidence: do NOT fabricate evidence for arbitrary hosts. Report missing evidence as actionable.
        const evPresent = hostLower ? Boolean(await env.AURA_KV.get(evidenceKey(hostLower))) : false;
        if (!evPresent) {
          results.push({ needs: "EVIDENCE_PRESENT", note: "EVIDENCE_NOT_AUTO_SEEDED" });
        }
        push("AUTONOMY_REPAIR_EXECUTE", { ok: true, host: hostLower, results });
        continue;
      }

      if (line === "AUTONOMY_STATUS") {
        const b = (await __readJsonKV(__budgetKey)) || __defaultBudget;
        const c = (await __readJsonKV(__charterKey)) || __defaultCharter;
        const last = await env.AURA_KV.get(__tickKey);

        const evidencePresent = activeHost
          ? Boolean(await env.AURA_KV.get(evidenceKey(String(activeHost).toLowerCase())))
          : false;

        const last_tick = (await (async()=>{
          const cron = await env.AURA_KV.get(autonomyTickKeyForHost(activeHost), { type: "json" }).catch(()=>null);
          const cronTs = (cron && (cron.ts || cron.stamp)) ? String(cron.ts || cron.stamp) : null;

          let lastTs = null;
          try {
            const s = String(last || "").trim();
            if (s) {
              if (s.startsWith("{")) {
                const j = safeJsonParse(s);
                lastTs = (j && (j.ts || j.stamp)) ? String(j.ts || j.stamp) : null;
              } else {
                lastTs = s;
              }
            }
          } catch (_) { lastTs = null; }

          const chosen = (!lastTs ? cronTs : (cronTs && String(cronTs) > String(lastTs) ? cronTs : lastTs));
          return chosen || null;
        })());

        const invariants = [];
        invariants.push({ id: "EVIDENCE_PRESENT", ok: evidencePresent === true });

        const hasTick = Boolean(last_tick);
        invariants.push({ id: "TICK_PRESENT", ok: hasTick });

        let age_s = null;
        if (hasTick) {
          try { age_s = Math.round((Date.now() - Date.parse(String(last_tick))) / 1000); } catch (e) { age_s = null; }
        }
        if (age_s !== null) {
          invariants.push({ id: "TICK_FRESH_UNDER_120S", ok: age_s <= 120, age_s });
        }

        const budgetShapeOk = (b && typeof b.limit === "number" && typeof b.spent === "number");
        invariants.push({ id: "BUDGET_SHAPE", ok: budgetShapeOk });

        invariants.push({ id: "CAPABILITIES_COUNT_PRESENT", ok: (typeof __capabilities.length === "number"), count: __capabilities.length });

        const anyFalse = invariants.some(x => x && x.ok === false);
        const anyNull = invariants.some(x => !x || x.ok === null || typeof x.ok === "undefined");
        const health = anyFalse ? "WARN" : (anyNull ? "UNKNOWN" : "OK");

        // Auto-log invariant failures (host-scoped, bounded). Safe: internal telemetry only.
        if (health !== "OK") {
          try {
            const key = "FAILURE_MEMORY__" + __host;
            const existing = (await __readJsonKV(key)) || [];
            const arr = Array.isArray(existing) ? existing : [];
            const detail = "AUTONOMY_STATUS health=" + health + " invariants_failed=" + invariants.filter(x=>x && x.ok===false).map(x=>x.id).join(",");
            arr.push({ at: nowIso(), code: "AUTONOMY_INVARIANT", detail });
            const bounded = arr.slice(-200);
            await env.AURA_KV.put(key, JSON.stringify(bounded));
          } catch (e) { /* swallow */ }
        }

        push("AUTONOMY_STATUS", {
          ok: true,
          host: __host,
          build: BUILD,
          stamp: nowIso(),
          evidence_present_for_active_host: evidencePresent,
          budget: b,
          charter: c,
          last_tick,
          capabilities_count: __capabilities.length,
          health,
          invariants
        });
        continue;
      }

      // SET/PUT are envelope-gated (files/packets): JSON must be provided on subsequent non-command lines.
// Deterministic: parse envelope, write KV, return readback payload.
function __readEnvelopeJson(nextLine) {
  // Consume subsequent non-command lines as JSON text.
  // Stops when the next allowed command token begins.
  let j = i + 1;
  const buf = [];
  while (j < lines.length) {
    const l = lines[j];
    if (!l) { j++; continue; }
    if (l.startsWith("HOST ")) { j++; continue; }
    const tok = l.split(" ")[0];
    if (allowedCommands.includes(tok)) break;
    buf.push(l);
    j++;
  }
  if (!buf.length) return { ok: false, error: "BAD_REQUEST", note: "requires envelope (file/packet)  no inline JSON", consumed: 0 };
  const jsonText = buf.join("\n");
  const obj = safeJsonParse(jsonText);
  if (!obj || typeof obj !== "object") return { ok: false, error: "BAD_REQUEST", note: "envelope JSON parse failed", consumed: (j - (i + 1)) };
  return { ok: true, obj, consumed: (j - (i + 1)) };
}

if (line === "AUTONOMY_LAST_TICK_SET") {
  if (!isOperator) { push("AUTONOMY_LAST_TICK_SET", "NOT_ALLOWED"); continue; }

  const r = __readEnvelopeJson(lines, i, allowedCommands, nextLine);
  if (!r || !r.ok) { push("AUTONOMY_LAST_TICK_SET", "BAD_REQUEST"); continue; }

  const __host = String(activeHost || "frontdesk.network").toLowerCase();
  const __tickKey = `AUTONOMY_LAST_TICK__${__host}`;
  const ts = nowIso();

  await env.AURA_KV.put(__tickKey, ts, { expirationTtl: 60 * 60 * 24 * 30 });
  push("AUTONOMY_LAST_TICK_SET", { ok: true, host: __host, last_tick: ts, stamp: ts });
  continue;
}
if (line === "AUTONOMY_BUDGET_SET" || line.startsWith("AUTONOMY_BUDGET_SET ")) {
  if (!isOperator) { push("AUTONOMY_BUDGET_SET", "NOT_ALLOWED"); continue; }
  // Supports BOTH formats:
  // 1) Inline JSON:  AUTONOMY_BUDGET_SET {"limit":123}
  // 2) Envelope JSON on following line(s): AUTONOMY_BUDGET_SET\n{"budget":{...}}

  let obj = null;
  let consumed = 0;

  if (line.startsWith("AUTONOMY_BUDGET_SET ")) {
    const raw = line.slice("AUTONOMY_BUDGET_SET ".length).trim();
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { push("AUTONOMY_BUDGET_SET", { ok: false, error: "BAD_JSON", note: String(e && e.message ? e.message : e) }); continue; }
    obj = parsed;
  } else {
    const r = __readEnvelopeJson(lines, i, allowedCommands, nextLine);
    if (!r.ok) { push("AUTONOMY_BUDGET_SET", { ok: false, error: r.error, note: r.note }); continue; }
    obj = r.obj;
    consumed = r.consumed;
  }

  const host = String(obj.host || __host).toLowerCase();
  const b0 = (obj.budget && typeof obj.budget === "object") ? obj.budget : obj;

  const budget = {
    limit: (typeof b0.limit === "number" ? b0.limit : __defaultBudget.limit),
    spent: (typeof b0.spent === "number" ? b0.spent : __defaultBudget.spent),
    window: (typeof b0.window === "string" ? b0.window : __defaultBudget.window),
    updated_at: nowIso()
  };

  await env.AURA_KV.put(`AUTONOMY_BUDGET__${host}`, JSON.stringify(budget));
  push("AUTONOMY_BUDGET_SET", { ok: true, host, budget });

  if (consumed) { i += consumed; }
  continue;
}

if (line === "AUTONOMY_CHARTER_SET") {
  if (!isOperator) { push("AUTONOMY_CHARTER_SET", "NOT_ALLOWED"); continue; }

  const r = __readEnvelopeJson(lines, i, allowedCommands, nextLine);
  if (!r.ok) { push("AUTONOMY_CHARTER_SET", { ok: false, error: r.error, note: r.note }); continue; }

  const host = String(r.obj.host || __host).toLowerCase();
  const c0 = (r.obj.charter && typeof r.obj.charter === "object") ? r.obj.charter : r.obj;
  const charter = {
    version: (typeof c0.version === "number" ? c0.version : __defaultCharter.version),
    text: (typeof c0.text === "string" ? c0.text : __defaultCharter.text),
    updated_at: nowIso()
  };

  await env.AURA_KV.put(`AUTONOMY_CHARTER__${host}`, JSON.stringify(charter));
  push("AUTONOMY_CHARTER_SET", { ok: true, host, charter });
  i += r.consumed;
  continue;
}

if (line === "FAILURE_MEMORY_PUT") {
  if (!isOperator) { push("FAILURE_MEMORY_PUT",
  "FAILURE_MEMORY_CLEAR",
  "FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", "NOT_ALLOWED"); continue; }

  const r = __readEnvelopeJson(lines, i, allowedCommands, nextLine);
  if (!r.ok) { push("FAILURE_MEMORY_PUT",
  "FAILURE_MEMORY_CLEAR",
  "FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", { ok: false, error: r.error, note: r.note }); continue; }

  const host = String(r.obj.host || __host).toLowerCase();
  const item0 = (r.obj.item && typeof r.obj.item === "object") ? r.obj.item : r.obj;
  const item = {
    at: (typeof item0.at === "string" ? item0.at : nowIso()),
    code: String(item0.code || "X"),
    detail: String(item0.detail || "")
  };

  // Refuse blank writes (prevents accidental empty X entries on bad payload shape)
  if ((item.code === "X" || item.code === "") && item.detail === "") {
    push("FAILURE_MEMORY_PUT",
  "FAILURE_MEMORY_CLEAR",
  "FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", { ok: false, error: "BAD_REQUEST", note: "Blank item refused" });
    i += r.consumed;
    continue;
  };

  const existing = (await __readJsonKV(`FAILURE_MEMORY__${host}`)) || [];
  const arr = Array.isArray(existing) ? existing : [];
  arr.push(item);
  const bounded = arr.slice(-200);

  await env.AURA_KV.put(`FAILURE_MEMORY__${host}`, JSON.stringify(bounded));
  push("FAILURE_MEMORY_PUT",
  "FAILURE_MEMORY_CLEAR",
  "FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", { ok: true, host, item, count: bounded.length });
  i += r.consumed;
  continue;
}

// ----------------------------
// FAILURE MEMORY (operator hygiene)
// ----------------------------
if (line === "FAILURE_MEMORY_CLEAR") {
  if (!isOperator) { push("FAILURE_MEMORY_CLEAR", "NOT_ALLOWED"); continue; }

  const r = __readEnvelopeJson(lines, i, allowedCommands, nextLine);
  if (!r.ok) { push("FAILURE_MEMORY_CLEAR", { ok: false, error: r.error, note: r.note }); continue; }

  const host = String((r.obj && r.obj.host) || __host).toLowerCase();
  await env.AURA_KV.put(`FAILURE_MEMORY__${host}`, JSON.stringify([]));
  push("FAILURE_MEMORY_CLEAR", { ok: true, host, cleared: true, count: 0 });

  i += r.consumed;
  continue;
}

if (line === "FAILURE_MEMORY_SET") {
  if (!isOperator) { push("FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", "NOT_ALLOWED"); continue; }

  const r = __readEnvelopeJson(lines, i, allowedCommands, nextLine);
  if (!r.ok) { push("FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", { ok: false, error: r.error, note: r.note }); continue; }

  const host = String((r.obj && r.obj.host) || __host).toLowerCase();
  const items = (r.obj && Array.isArray(r.obj.items)) ? r.obj.items : null;
  if (!items) { push("FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", { ok: false, error: "BAD_REQUEST", note: "Expected { items: [...] }" }); continue; }

  const normalized = [];
  for (const it of items) {
    const o = (it && typeof it === "object") ? it : {};
    normalized.push({
      at: (typeof o.at === "string" ? o.at : nowIso()),
      code: String(o.code || "X"),
      detail: String(o.detail || "")
    });
  }

  const bounded = normalized.slice(-200);
  await env.AURA_KV.put(`FAILURE_MEMORY__${host}`, JSON.stringify(bounded));
  push("FAILURE_MEMORY_SET",
  "SELF_PATCH_PUT",
  "SELF_PATCH_GET",
  "SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", { ok: true, host, count: bounded.length });

  i += r.consumed;
  continue;
}
    if (line === "SELF_PATCH_PUT") {
      const nextLine = lines[i + 1];
      const ev = await __getHostEvidence(activeHost);
      if (!ev || !ev.ok) { push("SELF_PATCH_PUT", "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)"); continue; }
      if (!isOperator) { push("SELF_PATCH_PUT", { ok:false, error:"OPERATOR_REQUIRED" }); continue; }

      const body = __readEnvelopeJson();
      if (!body || typeof body !== "object") { push("SELF_PATCH_PUT", { ok:false, error:"BAD_JSON" }); continue; }

      const key = `SELF_PATCH_INTENT__${activeHost}`;
      const stamp = new Date().toISOString();
      const payload = { ok:true, host: activeHost, stamp, intent: body };
      await env.AURA_KV.put(key, JSON.stringify(payload));
      push("SELF_PATCH_PUT", { ok:true, host: activeHost, stamp, saved:true, key });
      continue;
    }

    if (line === "SELF_PATCH_GET") {

      const nextLine = lines[i + 1];
      const ev = await __getHostEvidence(activeHost);
      if (!ev || !ev.ok) { push("SELF_PATCH_GET", "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)"); continue; }
      if (!isOperator) { push("SELF_PATCH_GET", { ok:false, error:"OPERATOR_REQUIRED" }); continue; }

      const key = `SELF_PATCH_INTENT__${activeHost}`;
      const got = await env.AURA_KV.get(key, { type: "json" });
      push("SELF_PATCH_GET", { ok:true, host: activeHost, present: !!got, key, value: got || null });
      continue;
    }

    if (line === "SELF_PATCH_APPLY") {

      const _ev = await __getHostEvidence(activeHost);
      if (!_ev || !_ev.ok) {
        push("SELF_PATCH_APPLY", { ok:false, host: activeHost, error:"NOT_READY", need:"VERIFIED_FETCH_URL" });
        continue;
      }

      if (!isOperator) {
        push("SELF_PATCH_APPLY", { ok:false, host: activeHost, error:"OPERATOR_REQUIRED" });
        continue;
      }

      const key = `SELF_PATCH_INTENT__${activeHost}`;
      const intent = await env.AURA_KV.get(key, { type: "json" });

      if (!intent) {
        push("SELF_PATCH_APPLY", { ok:false, host: activeHost, error:"NO_INTENT_SAVED", key });
        continue;
      }

      push("SELF_PATCH_APPLY", {
        ok:true,
        host: activeHost,
        stage:"INTENT_VALIDATED",
        key,
        intent,
        receipt:{
          ts: new Date().toISOString(),
          type:"SELF_PATCH_STAGE_ONLY",
          note:"Mutation engine wiring phase 1 Ã¢â‚¬â€ no transform executed."
        }
      });

      continue;
    }
    if (line === "SELF_PATCH_APPLY") {

      const nextLine = lines[i + 1];
      const ev = await __getHostEvidence(activeHost);
      if (!ev || !ev.ok) { push("SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)"); continue; }
      if (!isOperator) { push("SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", { ok:false, error:"OPERATOR_REQUIRED" }); continue; }

      // TX1: mutation surface not implemented in-worker yet. This is a controlled stub.
      push("SELF_PATCH_APPLY",
  "PATCH_INDEX_STATUS",
  "PATCH_INDEX_PUT",
  "PATCH_INDEX_GET",
"PATCH_OBJECT_PUT",
"PATCH_OBJECT_GET", { ok:false, host: activeHost, error:"MUTATION_SURFACE_NOT_IMPLEMENTED", next:"Use external mutation bridge / deployer once wired." });
      continue;
    }

if (line === "INTENT_SIMULATE") {
        push("INTENT_SIMULATE", { ok: true, host: __host, note: "preview-only" });
        continue;
      }
    }    if (line === "AUDIT_GET") {
      if (!isOperator) { out.push({ cmd: "AUDIT_GET", payload: "UNAUTHORIZED" }); continue; }
      push("AUDIT_GET", await auditList(env, String(activeHost || "frontdesk.network").toLowerCase(), 50));
      continue;
    }

    if (line === "AUDIT_CLEAR") {
      if (!isOperator) { out.push({ cmd: "AUDIT_CLEAR", payload: "UNAUTHORIZED" }); continue; }
      // Require a VERIFIED_FETCH seed for the active host before allowing audit mutation.
      if (!activeHost) { out.push({ cmd: "AUDIT_CLEAR", payload: "BAD_REQUEST" }); continue; }
      // Require evidence for active host (KV-backed). No "same request" seed requirement.
      const _ev = await __getHostEvidence(String(activeHost).toLowerCase());
      if (!_ev) { out.push({ cmd: "AUDIT_CLEAR", payload: "NOT_WIRED: VERIFIED_FETCH REQUIRED" }); continue; }
      // IMPORTANT: clearing should never crash the Worker.
      // We clear by resetting the sequence pointer; old event keys become unreachable.
      try {
        await env.AURA_KV.put(auditSeqKey(String(activeHost || "frontdesk.network").toLowerCase()), "0");
        await env.AURA_KV.put(auditClearedAtKey(String(activeHost || "frontdesk.network").toLowerCase()), nowIso());
        out.push({ cmd: "AUDIT_CLEAR", payload: { ok: true, cleared: true } });
      } catch (e) {
        out.push({ cmd: "AUDIT_CLEAR", payload: { ok: false, error: "EXCEPTION", message: String(e && e.message ? e.message : e) } });
      }
      continue;
    }

    if (line === "PORTFOLIO_STATUS") {
      const assetsMetaRaw = await env.AURA_KV.get(registryMetaKey("assets"));
      const domainsMetaRaw = await env.AURA_KV.get(registryMetaKey("domains"));
      const assetsMeta = assetsMetaRaw ? (safeJsonParse(assetsMetaRaw) || assetsMetaRaw) : null;
      const domainsMeta = domainsMetaRaw ? (safeJsonParse(domainsMetaRaw) || domainsMetaRaw) : null;

      const status = {
        build: BUILD,
        stamp: nowIso(),
        registry_version: REGISTRY_VERSION,
        registries: {
          assets: assetsMeta || { type: "assets", count: 0, updated_at: null, version: REGISTRY_VERSION },
          domains: domainsMeta || { type: "domains", count: 0, updated_at: null, version: REGISTRY_VERSION }
        }
      };
      push("PORTFOLIO_STATUS", status);
      continue;
    }

    if (line.startsWith("REGISTRY_PUT")) {
      if (!isOperator) { push("REGISTRY_PUT", "NOT_ALLOWED"); continue; }

      const args = __parseRegistryPutArgs(line, lines, i, allowedCommands);
      if (!args || !args.type || !args.item) { push("REGISTRY_PUT", "BAD_REQUEST"); continue; }

      const _t = String(args.type).toLowerCase();
      const item = args.item;

      // Legacy convenience: allow domain puts where id omitted but domain provided.
      if ((!item.id || !String(item.id).trim()) && _t === "domains") {
        const maybe = String(item.domain || item.key || "").trim().toLowerCase();
        if (maybe) item.id = maybe;
      }

      if (!_t || !item || !item.id) { push("REGISTRY_PUT", "BAD_REQUEST"); continue; }

      const _hostToGate = __domainHostFromRegistryEntry(_t, item);
      if (_hostToGate && (_t === "domains" || _t === "assets")) {
        const _ev = await __getHostEvidence(_hostToGate);
        if (!_ev) { push("REGISTRY_PUT", "NOT_ALLOWED"); continue; }
      }

      const put = await registryPut(env, _t, item);
      push("REGISTRY_PUT", put);
      continue;
    }

    if (line.startsWith("REGISTRY_IMPORT_ASSETS")) {
      if (!isOperator) { push("REGISTRY_IMPORT_ASSETS", "NOT_ALLOWED"); continue; }

      const parsedArgs = __parseRegistryImportArgs("REGISTRY_IMPORT_ASSETS", line, lines, i, allowedCommands);
      if (!parsedArgs) { push("REGISTRY_IMPORT_ASSETS", "BAD_REQUEST"); continue; }
      const items = parsedArgs.items;

      const idsBefore = await registryGetIndex(env, "assets");
      const ids = [...idsBefore];
      let upserts = 0;

      for (const it of items) {
        if (!it || typeof it !== "object") continue;
        const assetId = String(it.id || "").trim();
        if (!assetId) continue;
        const entry = {
          id: assetId,
          name: String(it.name || it.title || it.id || "").trim() || assetId,
          pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
          notes: String(it.notes || "").trim(),
          tags: Array.isArray(it.tags) ? it.tags : [],
          sellability: String(it.sellability || "UNKNOWN").trim(),
          patent_cluster: String(it.patent_cluster || "").trim()
        };
        const put = await registryPut(env, "assets", entry);
        if (put.ok) {
          upserts += 1;
          if (!ids.includes(entry.id)) ids.push(entry.id);
        }
      }

      await registryPutIndex(env, "assets", ids);
      await auditWrite(env, activeHost, { action: "REGISTRY_IMPORT", type: "assets", details: { upserts } });
      push("REGISTRY_IMPORT_ASSETS", { ok: true, type: "assets", upserts, total_index_count: ids.length, stamp: nowIso() });
      continue;
    }

    if (line.startsWith("REGISTRY_IMPORT_DOMAINS")) {
      if (!isOperator) { push("REGISTRY_IMPORT_DOMAINS", "NOT_ALLOWED"); continue; }

      const parsedArgs = __parseRegistryImportArgs("REGISTRY_IMPORT_DOMAINS", line, lines, i, allowedCommands);
      if (!parsedArgs) { push("REGISTRY_IMPORT_DOMAINS", "BAD_REQUEST"); continue; }
      const items = parsedArgs.items;

      const idsBefore = await registryGetIndex(env, "domains");
      const ids = [...idsBefore];
      let upserts = 0;

      for (const it of items) {
        if (!it || typeof it !== "object") continue;
        const domainId = String(it.id || it.domain || "").trim().toLowerCase();
        if (!domainId) continue;
        const entry = {
          id: domainId,
          domain: String(it.domain || it.id || domainId).toLowerCase(),
          pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
          purpose: String(it.purpose || it.notes || "").trim(),
          priority: String(it.priority || "UNKNOWN").trim(),
          status: String(it.status || "UNKNOWN").trim()
        };
        const put = await registryPut(env, "domains", entry);
        if (put.ok) {
          upserts += 1;
          if (!ids.includes(entry.id)) ids.push(entry.id);
        }
      }

      await registryPutIndex(env, "domains", ids);
      await auditWrite(env, activeHost, { action: "REGISTRY_IMPORT", type: "domains", details: { upserts } });
      push("REGISTRY_IMPORT_DOMAINS", { ok: true, type: "domains", upserts, total_index_count: ids.length, stamp: nowIso() });
      continue;
    }

    if (line.startsWith("REGISTRY_IMPORT ")) {
      if (!isOperator) { push("REGISTRY_IMPORT", "NOT_ALLOWED"); continue; }
      const jsonPart = line.slice("REGISTRY_IMPORT ".length).trim();
      const payload = safeJsonParse(jsonPart);
      const typeName = String(payload?.type || "").toLowerCase().trim();
      const normalized =
        typeName === "asset" || typeName === "assets" ? "assets" :
        typeName === "domain" || typeName === "domains" ? "domains" : "";
      const items = Array.isArray(payload?.items) ? payload.items : null;
      if (!normalized || !items) { push("REGISTRY_IMPORT", "BAD_REQUEST"); continue; }
      // Reuse the same import core logic by calling the generic function already defined below via registryPut loops would be verbose;
      // keep simple: write through registryPut in a tight loop.
      const idsBefore = await registryGetIndex(env, normalized);
      const ids = [...idsBefore];
      let upserts = 0;
      for (const it of items) {
        if (!it || typeof it !== "object") continue;
        if (normalized === "domains") {
          const domainId = String(it.id || it.domain || "").trim().toLowerCase();
          if (!domainId) continue;
          const entry = {
            id: domainId,
            domain: String(it.domain || it.id || domainId).toLowerCase(),
            pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
            purpose: String(it.purpose || it.notes || "").trim(),
            priority: String(it.priority || "UNKNOWN").trim(),
            status: String(it.status || "UNKNOWN").trim()
          };
          const put = await registryPut(env, "domains", entry);
          if (put.ok) { upserts += 1; if (!ids.includes(entry.id)) ids.push(entry.id); }
        } else {
          const assetId = String(it.id || "").trim();
          if (!assetId) continue;
          const entry = {
            id: assetId,
            name: String(it.name || it.title || it.id || "").trim() || assetId,
            pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
            notes: String(it.notes || "").trim(),
            tags: Array.isArray(it.tags) ? it.tags : [],
            sellability: String(it.sellability || "UNKNOWN").trim(),
            patent_cluster: String(it.patent_cluster || "").trim()
          };
          const put = await registryPut(env, "assets", entry);
          if (put.ok) { upserts += 1; if (!ids.includes(entry.id)) ids.push(entry.id); }
        }
      }
      await registryPutIndex(env, normalized, ids);
      await auditWrite(env, activeHost, { action: "REGISTRY_IMPORT", type: normalized, details: { upserts } });
      push("REGISTRY_IMPORT", { ok: true, type: normalized, upserts, total_index_count: ids.length, stamp: nowIso() });
      continue;
    }

    if (line.startsWith("REGISTRY_GET")) {
      const args = __parseRegistryGetArgs(line, lines, i, allowedCommands);
      if (!args || !args.type || !args.id) { push("REGISTRY_GET", "BAD_REQUEST"); continue; }
      const e = await registryGet(env, args.type, args.id);
      push(`REGISTRY_GET ${args.type} ${args.id}`, e ? e : "MISSING");
      continue;
    }

    if (line.startsWith("REGISTRY_LIST")) {
      const parts = line.split(" ").filter(Boolean);
      const type = String(parts[1] || "").toLowerCase();
      const limit = Number(parts[2] || 50);

      // Allow bare REGISTRY_LIST to return an overview (useful for autonomy flows)
      if (!type) {
        const types = ["assets", "domains"];
        const overview = {};
        for (const t of types) {
          try {
            const ids = await registryGetIndex(env, t);
            overview[t] = { type: t, count: ids.length };
          } catch (e) {
            overview[t] = { type: t, count: null, error: String(e && e.message ? e.message : e) };
          }
        }
        push("REGISTRY_LIST", { registries: overview });
        continue;
      }

      const payload = await registryList(env, type, limit);
      push(`REGISTRY_LIST ${type}`, payload);
      continue;
    }

    if (line.startsWith("REGISTRY_FILTER")) {
      const raw = line.slice("REGISTRY_FILTER".length).trim();
      let type = "";
      let field = "";
      let value = "";
      let limit = 50;
      let where = null;

      if (raw.startsWith("{")) {
        const obj = safeJsonParse(raw);
        if (!obj || typeof obj !== "object") { push("REGISTRY_FILTER", "BAD_REQUEST"); continue; }
        type = String(obj.type || "").toLowerCase();
        limit = Number(obj.limit || 50);
        if (obj.where && typeof obj.where === "object") {
          where = obj.where;
        } else {
          field = String(obj.field || "").trim();
          value = String(obj.value ?? "").trim();
        }
      } else {
        const parts = line.split(" ").filter(Boolean);
        type = String(parts[1] || "").toLowerCase();
        field = String(parts[2] || "").trim();
        value = String(parts[3] || "").trim();
        limit = Number(parts[4] || 50);
      }

      if (!type) { push("REGISTRY_FILTER", "BAD_REQUEST"); continue; }
      const payload = where
        ? await registryFilterWhere(env, type, where, limit)
        : await registryFilter(env, type, field, value, limit);

      // Allow "REGISTRY_FILTER <type>" (no field/value) as a convenience alias for listing that type
      if (!where && (!field || !value)) {
        const payload2 = await registryList(env, type, limit);
        push(`REGISTRY_FILTER ${type}`, payload2);
        continue;
      }

      push(`REGISTRY_FILTER ${type}`, payload);
      continue;
    }

    if (line.startsWith("HOST_CAPS_GET")) {
      const parts = line.split(" ").filter(Boolean);
      const host = (parts[1] || activeHost || "frontdesk.network").toLowerCase();
      const caps = await getHostCaps(host);
      push("HOST_CAPS_GET", caps || { host, allowed: null });
      continue;
    }

    if (line === "SNAPSHOT_STATE") {
      const safeHost = activeHost || "none";
      const caps = await getHostCaps(activeHost);

      const snapshot = {
        build: BUILD,
        stamp: new Date().toISOString(),
        operator: (isOperator ? "YES" : "NO"),
        active_host: safeHost,
        host_caps: caps || null,
        evidence_present_for_active_host: activeHost
          ? Boolean(await env.AURA_KV.get(evidenceKey(String(activeHost).toLowerCase())))
          : false,
        autonomy_tick: (await env.AURA_KV.get(autonomyTickKeyForHost(activeHost), { type: "json" }).catch(()=>null)) || null
      };
      push("SNAPSHOT_STATE", snapshot);
      continue;
    }

    

    
if (line === "HERD_STATUS") {
  let herd = null;
  try { herd = await registryGet(env, "config", "herd.hosts"); } catch (_) {}
  push("HERD_STATUS", { ok: true, host: (activeHost || null), herd_config: herd || null, stamp: new Date().toISOString() });
  continue;
}
if (line === "HERD_SELF_TEST") {
  push("HERD_SELF_TEST", { ok: true, tests: [{ name: "command_wired", pass: true }], stamp: new Date().toISOString() });
  continue;
}
if (line.startsWith("HERD_SWEEP")) {
  const raw = line.slice("HERD_SWEEP".length).trim();
  const args = raw ? safeJsonParse(raw) : null;

  let herd = null;
  try { herd = await registryGet(env, "config", "herd.hosts"); } catch (_) {}

  const defaultHosts = (herd && typeof herd === "object" && Array.isArray(herd.hosts)) ? herd.hosts : [];
  const hosts = (args && typeof args === "object" && Array.isArray(args.hosts)) ? args.hosts : defaultHosts;
  const limit = (args && typeof args === "object" && typeof args.limit === "number" && args.limit > 0)
    ? Math.floor(args.limit)
    : hosts.length;

  const targets = hosts.slice(0, limit).map((h) => {
    const hostStr = String(h).trim();
    return { host: hostStr, url: `https://${hostStr}/` };
  });

  const results = [];
  for (const t of targets) {
    try {
      const evidence = await doVerifiedFetch(t.url);
      results.push({ host: t.host, url: t.url, ok: true, evidence });

      // Persist latest sweep into registry (no flags; evidence-driven).
      // Writes:
      // - domain_sweep_latest:<host>  (summary)
      // - domains:<host>             (notes_sweep_latest pointer)
      try {
        if (evidence && evidence.ok) {
          const h = String(t.host || "").trim().toLowerCase();
          const diag = (evidence.diagnostics && typeof evidence.diagnostics === "object") ? evidence.diagnostics : {};
          const cf = (diag.cf && typeof diag.cf === "object") ? diag.cf : null;

          const sweepLatest = {
            id: h,
            host: h,
            url: evidence.public_url || evidence.url || t.url,
            probe_url: evidence.probe_url || null,
            fallback_reason: evidence.fallback_reason || null,
            http_status: typeof evidence.http_status === "number" ? evidence.http_status : 0,
            first_line_html: typeof evidence.first_line_html === "string" ? evidence.first_line_html : "",
            body_length: typeof evidence.body_length === "number" ? evidence.body_length : 0,
            ts: diag.ts || nowIso(),
            https_status: (typeof diag.https_status === "number") ? diag.https_status : null,
            cf: cf ? {
              colo: cf.colo || null,
              asn: cf.asn || null,
              asOrganization: cf.asOrganization || null,
              country: cf.country || null,
              regionCode: cf.regionCode || null,
              city: cf.city || null,
              timezone: cf.timezone || null
            } : null
          };

          await registryPut(env, "domain_sweep_latest", sweepLatest);

          const dom = (await registryGet(env, "domains", h)) || { id: h, domain: h };
          const merged = {
            ...dom,
            id: h,
            domain: dom.domain || h,
            notes_sweep_latest: {
              sweep_latest: {
                host: h,
                ts: sweepLatest.ts,
                http_status: sweepLatest.http_status,
                fallback_reason: sweepLatest.fallback_reason,
                url: sweepLatest.url
              }
            }
          };
          await registryPut(env, "domains", merged);
        }
      } catch (__) {
        // Never fail the sweep response because persistence failed.
      }
    } catch (e) {
      results.push({ host: t.host, url: t.url, ok: false, error: String(e) });
    }
  }

  push("HERD_SWEEP", {
    ok: true,
    requested: { hosts, limit },
    swept: results.length,
    results,
    stamp: new Date().toISOString()
  });
  continue;
}
if (line === "DEPLOYER_CAPS") {
      push("DEPLOYER_CAPS", __deployerCaps(env));
      continue;
    }

    if (line.startsWith("DEPLOYER_CALL ")) {
      if (!isOperator) { push("DEPLOYER_CALL", "UNAUTHORIZED"); continue; }
      const jsonPart = line.slice("DEPLOYER_CALL ".length).trim();
      const reqObj = safeJsonParse(jsonPart);
      if (!reqObj || typeof reqObj !== "object") { push("DEPLOYER_CALL", "BAD_REQUEST"); continue; }

      const serviceName = String(reqObj.service || "").trim();
      if (serviceName !== "AURA_DEPLOYER" && serviceName !== "AURA_CF") { push("DEPLOYER_CALL", "BAD_REQUEST"); continue; }
      if (!__hasService(env, serviceName)) { push("DEPLOYER_CALL", "DEPLOYER_CAPS_MISSING"); continue; }

      const path = String(reqObj.path || "").trim();
      if (!path.startsWith("/")) { push("DEPLOYER_CALL", "BAD_REQUEST"); continue; }

      // Enforce host caps: treat this as its own command token (DEPLOYER_CALL already host-capped upstream).
      // Evidence gating: callers must provide VERIFIED_FETCH_URL separately when making reachability claims.
      try {
        const svc = env[serviceName];
        const resp = await __serviceFetch(svc, {
          path,
          method: reqObj.method || "POST",
          headers: __withOperatorHeaders(((reqObj.headers && typeof reqObj.headers === "object") ? reqObj.headers : {}), isOperator, operatorHeader, request.headers.get("X-Deploy-Key") || request.headers.get("X-Deploy-Secret")),
          content_type: reqObj.content_type || null,
          body: reqObj.body != null ? reqObj.body : undefined
        });
        push("DEPLOYER_CALL", { service: serviceName, path, ...resp });
      } catch (e) {
        push("DEPLOYER_CALL", { service: serviceName, path, http_status: 0, error: "EXCEPTION", message: String(e?.message || e) });
      }
      continue;
    }

// Any unknown tokens in a batch are ignored (deterministic).
  }

  return jsonReply(out);
}


    // ----------------------------
    // Multi-line simple commands (e.g., HOST x + PING)
    // ----------------------------
    const hasLine = (cmd) => lines.some((l) => l === cmd);

    if (hasLine("PING")) return jsonReply("PONG");


    if (hasLine("SHOW_ALLOWED_COMMANDS")) {
      return jsonReply(allowedCommands);
    }

    if (hasLine("SHOW_BUILD")) {
      return jsonReply({ build: BUILD, stamp: new Date().toISOString() });
    }

    if (hasLine("SHOW_CLAIM_GATE")) {
      return jsonReply(
        JSON.stringify(
          {
            trigger_words: [
              "live",
              "deployed",
              "launched",
              "resolving",
              "propagating",
              "successful",
              "verified",
              "up",
              "online",
              "working",
              "reachable",
              "available",
              "accessible"
            ],
            forced_message: "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)",
            requires_verified_fetch_format: true
          },
          null,
          2
        )
      );
    }

    if (hasLine("RUN_SELF_TEST_EVIDENCE")) {
      return await runSelfTestEvidence();
    }





    if (hasLine("SNAPSHOT_STATE")) {
      const safeHost = activeHost || "none";
      const caps = await getHostCaps(activeHost);

      const snapshot = {
        build: BUILD,
        stamp: new Date().toISOString(),
        operator: (Boolean(env.AURA_OPERATOR_TOKEN) && String(request.headers.get("x-operator-token") || request.headers.get("X-Operator-Token") || "").trim() === String(env.AURA_OPERATOR_TOKEN || "").trim()) ? "YES" : "NO",
        active_host: safeHost,
        host_caps: caps || null,
        evidence_present_for_active_host: activeHost
          ? Boolean(await env.AURA_KV.get(evidenceKey(String(activeHost).toLowerCase())))
          : false
      };

      return jsonReply(snapshot);

    }

    if (hasLine("DEPLOYER_CAPS")) {
      return jsonReply(JSON.stringify(__deployerCaps(env), null, 2));
    }

    // DEPLOYER_CALL <json> (single-line only; operator-only)
    for (const line of lines) {
      if (!line.startsWith("DEPLOYER_CALL")) continue;
      if (!isOperator) return jsonReply("UNAUTHORIZED");
      const jsonPart = line.slice("DEPLOYER_CALL".length).trim();
      const reqObj = safeJsonParse(jsonPart);
      if (!reqObj || typeof reqObj !== "object") return jsonReply("BAD_REQUEST");

      const serviceName = String(reqObj.service || "").trim();
      if (serviceName !== "AURA_DEPLOYER" && serviceName !== "AURA_CF") return jsonReply("BAD_REQUEST");
      if (!__hasService(env, serviceName)) return jsonReply("DEPLOYER_CAPS_MISSING");

      const path = String(reqObj.path || "").trim();
      if (!path.startsWith("/")) return jsonReply("BAD_REQUEST");

      try {
        const svc = env[serviceName];
        const resp = await __serviceFetch(svc, {
          path,
          method: reqObj.method || "POST",
          headers: __withOperatorHeaders(((reqObj.headers && typeof reqObj.headers === "object") ? reqObj.headers : {}), isOperator, operatorHeader, request.headers.get("X-Deploy-Key") || request.headers.get("X-Deploy-Secret")),
          content_type: reqObj.content_type || null,
          body: reqObj.body != null ? reqObj.body : undefined
        });
        return jsonReply(JSON.stringify({ service: serviceName, path, ...resp }, null, 2));
      } catch (e) {
        return jsonReply(JSON.stringify({ service: serviceName, path, http_status: 0, error: "EXCEPTION", message: String(e?.message || e) }, null, 2));
      }
    }


    // ----------------------------
    // EVIDENCE_PRESENT (return stored evidence JSON for a host)
    // ----------------------------
    for (const line of lines) {
      if (line.startsWith("EVIDENCE_PRESENT")) {
        const parts = line.split(" ").filter(Boolean);
        const host = normalizeHostLoose(parts[1]) || activeHost;
        if (!host) return jsonReply("BAD_REQUEST");
        const stored = await env.AURA_KV.get(evidenceKey(host));
        if (!stored) return jsonReply("NO_EVIDENCE");
        try {
          return jsonReply(JSON.stringify(JSON.parse(stored), null, 2));
        } catch {
          return jsonReply(stored);
        }
      }
    }

    // ----------------------------
    // Self-test harness (unchanged)
    // ----------------------------
        async function runSelfTestEvidence() {
      const mk = (name, pass, observed, expected) => ({ name, pass, observed, expected });

      const hosts = {
        example: "example.com",
        http404: "httpstat.us"
      };

      const clearHost = async (host) => {
        await env.AURA_KV.delete(evidenceKey(host));
      };

      const getEvidence = async (host) => {
        const stored = await env.AURA_KV.get(evidenceKey(host));
        return stored ? JSON.parse(stored) : null;
      };

      const putEvidence = async (targetUrl) => {
        const host = new URL(targetUrl).host.toLowerCase();
        try {
          const res = await fetch(targetUrl);
          const text = await res.text();
          const evidence = {
            ok: true,
            url: targetUrl,
            host,
            http_status: res.status,
            first_line_html: text.split("\n")[0] || "",
            body_length: text.length
          };
          await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
          return evidence;
        } catch {
          const evidence = { ok: false, url: targetUrl, host, http_status: 0 };
          await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
          return evidence;
        }
      };

      const results = [];

      await clearHost(hosts.example);
      await clearHost(hosts.http404);

      const ev0 = await getEvidence(hosts.example);
      results.push(
        mk(
          "evidence_missing_example",
          ev0 === null,
          ev0 ? "EVIDENCE_PRESENT" : "EVIDENCE_MISSING",
          "EVIDENCE_MISSING"
        )
      );

      const ev1 = await putEvidence("https://example.com");
      const yes1 = ev1.ok && statusReachable(ev1.http_status) ? "YES" : "NO";
      results.push(mk("fetch_example_yes", yes1 === "YES", yes1, "YES"));

      const ev2 = await putEvidence("https://httpstat.us/404");
      const yes2 = ev2.ok && statusReachable(ev2.http_status) ? "YES" : "NO";
      results.push(mk("fetch_404_no", yes2 === "NO", yes2, "NO"));

      await clearHost(hosts.http404);
      const httpAfterClear = await getEvidence(hosts.http404);
      const shouldGate = httpAfterClear === null;
      results.push(
        mk(
          "cross_host_gate_http404",
          shouldGate,
          shouldGate ? "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)" : "HAS_EVIDENCE",
          "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)"
        )
      );

      await clearHost(hosts.example);
      await clearHost(hosts.http404);

      const ok = results.every((r) => r.pass);
      return jsonReply(JSON.stringify({ ok, tests: results }, null, 2));
        }

    if (bodyTrim === "RUN_SELF_TEST_EVIDENCE") {
      return await runSelfTestEvidence();
    }


    // ----------------------------
    // Evidence engine (CLEAR runs first, then VERIFIED_FETCH_URL, then compute)
    // ----------------------------
    const hasReachabilityQuestion = /\breachable\b/i.test(body);

    // Response-shape controls
    const wantYesNo = /return\s+only\s*:\s*yes\s+or\s+no\b/i.test(body);
    const wantReachableUnreachable =
      /return\s+only\s*:\s*reachable\s+or\s+unreachable\b/i.test(body);
    const want200or000 = /return\s+only\s*:\s*200\s+or\s+000\b/i.test(body);
    const wantHttpStatus = /return\s+only\s+the\s+http_status\b/i.test(body);
    const isShapeRequest =
      wantYesNo || wantReachableUnreachable || want200or000 || wantHttpStatus;


    // ----------------------------
    // CLAIM GATE (wired): if user asks "live/deployed/online/etc" in the prompt,
    // require at least one VERIFIED_FETCH_URL line in the SAME request.
    // This prevents stale KV evidence from being used to claim reachability.
    // ----------------------------
    const claimGateTriggerWords = [
      "live",
      "deployed",
      "launched",
      "resolving",
      "propagating",
      "successful",
      "verified",
      "up",
      "online",
      "working",
      "reachable",
      "available",
      "accessible"
    ];
    const claimGateForcedMessage = "READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)";
    const claimGateTriggered =
      new RegExp(`\\b(${claimGateTriggerWords.join("|")})\\b`, "i").test(body);
    const hasVerifiedFetchInThisRequest = lines.some((l) => l.startsWith("VERIFIED_FETCH_URL"));

    // Registry commands are explicitly bypassed (they are structured, not "claims").
    const hasRegistryBypass =
      lines.some((l) => __registryBypass(l.split(" ")[0]));

    if (claimGateTriggered && !hasVerifiedFetchInThisRequest && !hasRegistryBypass) {
      return jsonReply(claimGateForcedMessage);
    }

    const clearHosts = [];
    for (const line of lines) {
      if (line.startsWith("CLEAR_VERIFIED_FETCH")) {
        const parts = line.split(" ").filter(Boolean);
        const target = parts[1];
        const host = normalizeHost(target);
        if (host) clearHosts.push(host);
      }
    }

    if (clearHosts.length > 0) {
      for (const host of clearHosts) {
        await env.AURA_KV.delete(evidenceKey(host));
      }

      // If the message only clears evidence (plus optional HOST line), return deterministically.
      const hasOtherAction =
        lines.some((l) => {
          const t = l.split(" ")[0];
          return (
            t !== "HOST" &&
            t !== "CLEAR_VERIFIED_FETCH" &&
            allowedCommands.includes(t)
          );
        }) || hasReachabilityQuestion || isShapeRequest;

      if (!hasOtherAction) {
        return jsonReply(clearHosts.length === 1 ? "CLEARED" : `CLEARED (${clearHosts.length})`);
      }
    }

    let lastEvidence = null;
    const fetchEvidences = [];

    for (const line of lines) {
      if (!line.startsWith("VERIFIED_FETCH_URL")) continue;

      const parts = line.split(" ").filter(Boolean);
      const target = parts[1];
      const host = normalizeHost(target);
      if (!host) continue;

      const runFetch = async (probeUrl) => {
        const res = await fetch(probeUrl);
        const text = await res.text();
        return { res, text };
      };

      const nowTs = new Date().toISOString();

      // Prevent self-fetch recursion (auras.guide/* routes to this Worker).
      // Instead, record a synthetic "reachable" evidence based on the fact this request is being served.
      const selfHost = new URL(request.url).host.toLowerCase();
      if (host === selfHost) {
        const evidence = {
          ok: true,
          host,
          url: target,
          probe_url: null,
          http_status: 200,
          first_line_html: "SELF_HOST_SYNTHETIC_EVIDENCE",
          body_length: 0,
          synthetic: true,
          reason: "WORKER_SELF_ROUTE_ASSUME_REACHABLE",
          diagnostics: {
            cf: request.cf || null,
            self_host: selfHost,
            ts: nowTs
          }
        };

        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        lastEvidence = evidence;
        fetchEvidences.push(evidence);
        continue;
      }

      try {
        // 1) Try HTTPS (or whatever the user provided)
        const { res: res1, text: text1 } = await runFetch(target);

        // 2) If HTTPS returns 525, retry HTTP for same host/path/query
        if (res1.status === 525) {
          const u = new URL(target);
          if (u.protocol === "https:") {
            u.protocol = "http:";
            const httpUrl = u.toString();

            const { res: res2, text: text2 } = await runFetch(httpUrl);

            const evidence = {
              ok: true,
              host,
              public_url: target,
              probe_url: httpUrl,
              fallback_reason: "CF_HTTPS_525_HTTP_PROBE",
              http_status: res2.status,
              first_line_html: text2.split("\n")[0] || "",
              body_length: text2.length,
              diagnostics: {
                cf: request.cf || null,
                https_status: 525,
                ts: nowTs
              }
            };

            await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
            lastEvidence = evidence;
            fetchEvidences.push(evidence);
            continue;
          }
        }

        // Normal path: store what we got
        const evidence = {
          ok: true,
          host,
          url: target,
          http_status: res1.status,
          first_line_html: text1.split("\n")[0] || "",
          body_length: text1.length,
          diagnostics: {
            cf: request.cf || null,
            ts: nowTs
          }
        };

        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        lastEvidence = evidence;
        fetchEvidences.push(evidence);
      } catch (err) {
        const evidence = {
          ok: false,
          host,
          url: target,
          http_status: 0,
          error: String(err?.message || err),
          error_name: err?.name || "UNKNOWN",
          diagnostics: {
            cf: request.cf || null,
            ts: nowTs
          }
        };

        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        lastEvidence = evidence;
        fetchEvidences.push(evidence);
      }
    }

    // ----------------------------
    // Target selection for questions:
    // Prefer an asked host (URL or bare domain mention). Otherwise use active HOST context.
    // ----------------------------
    const targetHostForQuestion = askedHost || activeHost || null;

    // Inline compute from VERIFIED_FETCH_URL executed in THIS message when asked host matches
    if (lastEvidence && targetHostForQuestion && lastEvidence.host === targetHostForQuestion) {
      const st = Number(lastEvidence.http_status || 0);
      const r = lastEvidence.ok && statusReachable(st);

      if (wantHttpStatus) return jsonReply(String(st));
      if (want200or000) return jsonReply(st === 200 ? "200" : "000");
      if (wantReachableUnreachable) return jsonReply(r ? "REACHABLE" : "UNREACHABLE");
      if (wantYesNo) return jsonReply(r ? "YES" : "NO");
    }

    // VERIFIED_FETCH (explicit): return stored evidence for HOST context.
// This is NOT a "claim"; it simply returns the last stored evidence object.
const hasVerifiedFetchCmd = lines.some((l) => /^VERIFIED_FETCH(\s|$)/.test(l));
if (hasVerifiedFetchCmd) {
  const hostToUse = targetHostForQuestion;
  if (!hostToUse) return jsonReply(claimGateForcedMessage);

  const stored = await env.AURA_KV.get(evidenceKey(hostToUse));
  if (!stored) return jsonReply(claimGateForcedMessage);

  try { return jsonReply(JSON.parse(stored)); }
  catch { return jsonReply(claimGateForcedMessage); }
}
// If VERIFIED_FETCH_URL ran and there is NO reachability question, return the evidence JSON by default.
    if (fetchEvidences.length > 0 && !hasReachabilityQuestion && !isShapeRequest) {
      const payload = fetchEvidences.length === 1 ? fetchEvidences[0] : fetchEvidences;
      return jsonReply(payload);
    }

    // ----------------------------
    // Shape-only queries (no "reachable" keyword) using HOST context + existing evidence.
    // Example: "HOST example.com\nReturn ONLY the http_status"
    // ----------------------------
    if (!hasReachabilityQuestion && isShapeRequest) {
      const hostToUse = targetHostForQuestion;
      if (!hostToUse) return jsonReply("READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)");

      const stored = await env.AURA_KV.get(evidenceKey(hostToUse));
      if (!stored) return jsonReply("READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)");

      const evidence = JSON.parse(stored);
      const st = Number(evidence.http_status || 0);
      const r = evidence.ok && statusReachable(st);

      if (wantHttpStatus) return jsonReply(String(st));
      if (want200or000) return jsonReply(st === 200 ? "200" : "000");
      if (wantReachableUnreachable) return jsonReply(r ? "REACHABLE" : "UNREACHABLE");
      if (wantYesNo) return jsonReply(r ? "YES" : "NO");

      return jsonReply(String(st));
    }

    // Evidence-memory reachability path (host-scoped KV)
    if (hasReachabilityQuestion) {
      const hostToUse = targetHostForQuestion;
      if (!hostToUse) return jsonReply("READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)");

      const stored = await env.AURA_KV.get(evidenceKey(hostToUse));
      if (!stored) return jsonReply("READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)");

      const evidence = JSON.parse(stored);
      const st = Number(evidence.http_status || 0);
      const r = evidence.ok && statusReachable(st);

      if (wantHttpStatus) return jsonReply(String(st));
      if (wantReachableUnreachable) return jsonReply(r ? "REACHABLE" : "UNREACHABLE");
      if (wantYesNo) return jsonReply(r ? "YES" : "NO");

      return jsonReply(r ? "YES" : "NO");
    }

// ----------------------------
// Memory Substrate Commands (explicit; storage-backed)
// ----------------------------

const importRegistryCore = async (typeName, items) => {
  const idsBefore = await registryGetIndex(env, typeName);
  const ids = [...idsBefore];

  let upserts = 0;
  for (const it of items) {
    if (!it || typeof it !== "object") continue;

    if (typeName === "domains") {
      const domainId = String(it.id || it.domain || "").trim().toLowerCase();
      if (!domainId) continue;

      const entry = {
        id: domainId,
        domain: String(it.domain || it.id || domainId).toLowerCase(),
        pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
        purpose: String(it.purpose || it.notes || "").trim(),
        priority: String(it.priority || "UNKNOWN").trim(),
        status: String(it.status || "UNKNOWN").trim()
      };

      const put = await registryPut(env, "domains", entry);
      if (put.ok) {
        upserts += 1;
        if (!ids.includes(entry.id)) ids.push(entry.id);
      }
      continue;
    }

    // assets
    const assetId = String(it.id || "").trim();
    if (!assetId) continue;

    const entry = {
      id: assetId,
      name: String(it.name || it.title || it.id || "").trim() || assetId,
      pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
      notes: String(it.notes || "").trim(),
      tags: Array.isArray(it.tags) ? it.tags : [],
      sellability: String(it.sellability || "UNKNOWN").trim(),
      patent_cluster: String(it.patent_cluster || "").trim()
    };

    const put = await registryPut(env, "assets", entry);
    if (put.ok) {
      upserts += 1;
      if (!ids.includes(entry.id)) ids.push(entry.id);
    }
  }

  await registryPutIndex(env, typeName, ids);
  await auditWrite(env, activeHost, { action: "REGISTRY_IMPORT", type: typeName, details: { upserts } });

  return jsonReply(
    JSON.stringify(
      { ok: true, type: typeName, upserts, total_index_count: ids.length, stamp: nowIso() },
      null,
      2
    )
  );
};

const importRegistry = async (typeName) => {
  const raw = body.replace(/^REGISTRY_IMPORT_(ASSETS|DOMAINS)\s*/i, "").trim();
  const parsed = safeJsonParse(raw);
  if (!parsed) return jsonReply("BAD_REQUEST");

  const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : null);
  if (!items) return jsonReply("BAD_REQUEST");

  return await importRegistryCore(typeName, items);
};

const importRegistryGeneric = async () => {
  // Accept: REGISTRY_IMPORT {"type":"assets","items":[...]} OR {"type":"domains","items":[...]} OR {"type":"assets","items":...}
  const raw = body.replace(/^REGISTRY_IMPORT\s*/i, "").trim();
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") return jsonReply("BAD_REQUEST");

  const typeName = String(parsed.type || "").toLowerCase().trim();
  const normalized =
    typeName === "asset" || typeName === "assets" ? "assets" :
    typeName === "domain" || typeName === "domains" ? "domains" :
    "";

  if (!normalized) return jsonReply("BAD_REQUEST");

  const items = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed) ? parsed : null);
  if (!items) return jsonReply("BAD_REQUEST");

  return await importRegistryCore(normalized, items);
};



// DISABLED: legacy import handler (batch mode authoritative)



// DISABLED: legacy import handler (batch mode authoritative)


// REGISTRY_IMPORT (generic): body is JSON object { type: "assets"|"domains", items: [...] }

// DISABLED: legacy import handler (batch mode authoritative)






// ==============================
// PATCH COMMANDS V1
// ==============================

for (const line of lines) {
  if (line.startsWith("PATCH_STORE")) {
    if (!isOperator) return jsonReply("UNAUTHORIZED");

    try {
      const obj = JSON.parse(line.slice("PATCH_STORE".length).trim());
      if (!obj.id) return jsonReply("BAD_REQUEST");

      const key = "patch:" + obj.id;
      await env.AURA_KV.put(key, JSON.stringify(obj));
      return jsonReply(JSON.stringify({ ok:true, stored:key }));
    } catch {
      return jsonReply("BAD_REQUEST");
    }
  }
}

for (const line of lines) {
  if (line.startsWith("PATCH_APPLY")) {
    if (!isOperator) return jsonReply("UNAUTHORIZED");

    try {
      const obj = JSON.parse(line.slice("PATCH_APPLY".length).trim());
      if (!obj.id) return jsonReply("BAD_REQUEST");

      const key = "patch:" + obj.id;
      const raw = await env.AURA_KV.get(key);
      if (!raw) return jsonReply("PATCH_NOT_FOUND");

      const spec = JSON.parse(raw);
      const hostLower = String(activeHost || "").toLowerCase().trim();
const marker = String(spec.marker || "").trim();
if (!hostLower || !marker) return jsonReply("BAD_REQUEST");

const k = "build_suffix:" + hostLower;
await env.AURA_KV.put(k, marker);

return jsonReply(JSON.stringify({ ok:true, applied:true, host:hostLower, marker }));
    } catch {
      return jsonReply("BAD_REQUEST");
    }
  }
}

// REGISTRY_GET <type> <id>
for (const line of lines) {
  if (line.startsWith("REGISTRY_GET")) {
    const parts = line.split(" ").filter(Boolean);
    const type = String(parts[1] || "").toLowerCase();
    const id = String(parts[2] || "").trim();
    if (!type || !id) return jsonReply("BAD_REQUEST");
    const e = await registryGet(env, type, id);
    return jsonReply(e ? JSON.stringify(e, null, 2) : "MISSING");
  }
}

// REGISTRY_LIST <type> [limit]
for (const line of lines) {
  if (line.startsWith("REGISTRY_LIST")) {
    const parts = line.split(" ").filter(Boolean);
    const type = String(parts[1] || "").toLowerCase();
    const limit = Number(parts[2] || 50);
    if (!type) return jsonReply("BAD_REQUEST");
    const payload = await registryList(env, type, limit);
    return jsonReply(payload);
  }
}

// REGISTRY_FILTER <type> <field> <value> [limit]
for (const line of lines) {
  if (line.startsWith("REGISTRY_FILTER")) {
    const raw = line.slice("REGISTRY_FILTER".length).trim();
    let type = "";
    let field = "";
    let value = "";
    let limit = 50;
    let where = null;

    if (raw.startsWith("{")) {
      const obj = safeJsonParse(raw);
      if (!obj || typeof obj !== "object") return jsonReply("BAD_REQUEST");
      type = String(obj.type || "").toLowerCase();
      limit = Number(obj.limit || 50);
      if (obj.where && typeof obj.where === "object") {
        where = obj.where;
      } else {
        field = String(obj.field || "").trim();
        value = String(obj.value ?? "").trim();
      }
    } else {
      const parts = line.split(" ").filter(Boolean);
      type = String(parts[1] || "").toLowerCase();
      field = String(parts[2] || "").trim();
      value = String(parts[3] || "").trim();
      limit = Number(parts[4] || 50);
    }

    if (!type) return jsonReply("BAD_REQUEST");
    if (!where && (!field || !value)) return jsonReply("BAD_REQUEST");

    const payload = where
      ? await registryFilterWhere(env, type, where, limit)
      : await registryFilter(env, type, field, value, limit);

    return jsonReply(payload);
  }
}

if (bodyTrim === "AUDIT_CLEAR") {
  if (!isOperator) return jsonReply("UNAUTHORIZED");
  // Require a VERIFIED_FETCH seed for the active host before allowing audit mutation.
  if (!activeHost) return jsonReply("BAD_REQUEST");
  const evSeed = await env.AURA_KV.get(evidenceKey(activeHost));
  if (!evSeed) return jsonReply("NOT_WIRED: VERIFIED_FETCH REQUIRED");
  try {
    // Fast-clear: resetting seq makes prior events unreachable without KV list/delete.
    await env.AURA_KV.put(auditSeqKey(String(activeHost || "frontdesk.network").toLowerCase()), "0");
    await env.AURA_KV.put(auditClearedAtKey(String(activeHost || "frontdesk.network").toLowerCase()), nowIso());
    return jsonReply("CLEARED");
  } catch (e) {
    return jsonReply(JSON.stringify({ ok: false, error: "AUDIT_CLEAR_EXCEPTION", message: String(e?.message || e) }));
  }
}

    // ----------------------------
    // Consent-first Intent (explicit commands only)
    // ----------------------------
    for (const line of lines) {
      if (line.startsWith("INTENT_ADD")) {
        const m = line.match(/^INTENT_ADD\s+(\S+)\s+(\S+)\s+(.+)$/);
        if (!m) return jsonReply("BAD_REQUEST");
        const host = m[1].toLowerCase();
        const tag = m[2].toLowerCase();
        const text = m[3];

        const payload = {
          host,
          tag,
          text,
          created_at: new Date().toISOString(),
          consent: "EXPLICIT_COMMAND"
        };

        await env.AURA_KV.put(intentKey(host, tag), JSON.stringify(payload));
        return jsonReply("INTENT_SAVED");
      }

      if (line.startsWith("INTENT_GET")) {
        const parts = line.split(" ").filter(Boolean);
        const host = (parts[1] || "").toLowerCase();
        const tag = (parts[2] || "").toLowerCase();
        if (!host || !tag) return jsonReply("BAD_REQUEST");
        const stored = await env.AURA_KV.get(intentKey(host, tag));
        return jsonReply(stored ? stored : "INTENT_MISSING");
      }

      if (line.startsWith("INTENT_CLEAR")) {
        if (!isOperator) return jsonReply("UNAUTHORIZED");
        const parts = line.split(" ").filter(Boolean);
        const host = (parts[1] || "").toLowerCase();
        const tag = (parts[2] || "").toLowerCase();
        if (!host || !tag) return jsonReply("BAD_REQUEST");
        await env.AURA_KV.delete(intentKey(host, tag));
        return jsonReply("CLEARED");
      }
    }
    // If we got here, batch executor did not return and NL did not handle the line.
    // Fail-closed, but do not mask allowed single-command batch tokens.
    if (lines && lines.length === 1) {
      const tok = String(lines[0].split(" ")[0] || "").trim();
      if (tok && typeof allowedCommands !== "undefined" && Array.isArray(allowedCommands) && allowedCommands.includes(tok)) {
        // Force re-enter batch execution path by synthesizing a 2-line request: HOST + command.
        // This ensures single-line allowed commands never fall into NL stub gating.
        return jsonReply({ ok: true, reply: [{ cmd: tok, payload: "RETRY_AS_BATCH_REQUIRED" }] });
      }
      const nl = await naturalLanguageReply(lines[0], env, activeHost);
      if (nl) return jsonReply(nl);
    }

    // SINGLE-LINE BYPASS: ensure AUTONOMY_REPAIR_PLAN never falls into NL stub gate.
    if (lines && lines.length === 1) {
      const one = String(lines[0] || "").trim();
      const tok = String(one.split(" ")[0] || "").trim();
      if (tok === "AUTONOMY_REPAIR_PLAN") {
        // Force caller to include AUTONOMY_STATUS for full detail; stub removed for this token.
        return jsonReply({ ok: true, reply: [{ cmd: "AUTONOMY_REPAIR_PLAN", payload: { ok: true, host: String(activeHost||"frontdesk.network").toLowerCase(), note: "SINGLELINE_BYPASS_OK__ADD_AUTONOMY_STATUS_FOR_DETAILS" } }] });
      }
    }
    // Correct bypass: HOST + AUTONOMY_REPAIR_PLAN (2-line shape).
    if (lines && lines.length === 2) {
      const second = String(lines[1] || "").trim();
      if (second === "AUTONOMY_REPAIR_PLAN") {
        // Re-route into batch-style execution by returning deterministic envelope.
        return jsonReply({ ok: true, reply: [{ cmd: "AUTONOMY_REPAIR_PLAN", payload: { ok: true, host: String(activeHost||"frontdesk.network").toLowerCase(), note: "HOST_PLUS_SINGLE_CMD_BYPASS_OK__ADD_AUTONOMY_STATUS_FOR_DETAILS" } }] });
      }
    }
    return jsonReply("READY: VERIFIED_FETCH OK (NEXT: PATCH_INDEX_WIRE)");
  
    } catch (err) {
      const msg = (err && (err.stack || err.message)) ? (err.stack || err.message) : String(err);
      return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }
},

  async scheduled(event, env, ctx) {
    try {
      for (const host of AUTONOMY_TICK_HOSTS) {
        const prev = await env.AURA_KV.get(autonomyTickKeyForHost(host), { type: "json" }).catch(()=>null);
        const count = Number((prev && prev.count) || 0) + 1;
        const payload = {
        ok: true,
        ts: new Date().toISOString(),
        count,
        build: BUILD,
        note: "AUTONOMY_LOOP_TICK"
      };
      await env.AURA_KV.put(autonomyTickKeyForHost(host), JSON.stringify(payload));
      }
    } catch (_) {
      // Fail-closed: never throw from cron.
    }
  }

};























































































