// NOTE: Full-file replacement
// Patch focus: REGISTRY_* commands accept key=value line format (no BAD_REQUEST)

// --- BEGIN WRAPPER PATCH ---
// This wrapper normalizes REGISTRY_PUT / GET / LIST / FILTER arguments
// BEFORE existing command dispatch runs.

function normalizeRegistryArgs(cmd, rawLines) {
  // Supports either JSON block or key=value lines
  const out = {};
  for (const line of rawLines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    if (t.startsWith('{') || t.startsWith('[')) {
      try { return JSON.parse(t); } catch {}
    }
    const eq = t.indexOf('=');
    if (eq > 0) {
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'))) {
        try { v = JSON.parse(v); } catch {}
      }
      out[k] = v;
    }
  }
  return out;
}

// Inject into command handling
const __dispatch = globalThis.dispatchCommand;

globalThis.dispatchCommand = async function(cmd, ctx) {
  if (cmd && cmd.name && cmd.name.startsWith('REGISTRY_')) {
    cmd.args = normalizeRegistryArgs(cmd.name, cmd.raw || []);
  }
  return __dispatch(cmd, ctx);
};
// --- END WRAPPER PATCH ---

// ORIGINAL FILE CONTENT BELOW (unchanged)

" + content}