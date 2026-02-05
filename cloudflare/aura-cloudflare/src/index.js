// AURA_CF — Autonomy Final Wiring (Full-File Replacement)
// Uses Cloudflare Service Binding to Aura Core (env.AURA_CORE)
// No UI changes. Operator-token gated.

export default {
  async fetch(request, env) {
    const op = request.headers.get('x-operator-token');
    if (!op) return json({ ok:false, error:'unauthorized' }, 401);

    const url = new URL(request.url);

    if (url.pathname === '/zone/inspect') {
      if (request.method !== 'POST') {
        return json({ ok:false, error:'method_not_allowed' }, 405);
      }

      if (!(request.headers.get('content-type') || '').includes('application/json')) {
        return json({ ok:false, error:'bad_request', detail:'content_type_required' }, 400);
      }

      let body;
      try { body = await request.json(); }
      catch { return json({ ok:false, error:'bad_json' }, 400); }

      const zone = body.zone;
      if (!zone) return json({ ok:false, error:'missing_zone' }, 400);

      const allowed = (env.ALLOWED_ZONES || '').split(',').map(s=>s.trim()).filter(Boolean);
      if (allowed.length && !allowed.includes(zone)) {
        return json({ ok:false, error:'zone_not_allowed', zone }, 403);
      }

      // VERIFIED_FETCH via service binding (no network hop)
      const vfPayload = `VERIFIED_FETCH_GET https://${zone}\n`;

      const vf = await env.AURA_CORE.fetch('https://auras.guide/chat', {
        method: 'POST',
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-operator-token': op
        },
        body: vfPayload
      });

      const txt = await vf.text();
      if (!vf.ok || txt.includes('REQUIRED')) {
        return json({ ok:false, error:'VERIFIED_FETCH_REQUIRED' }, 409);
      }

      return json({
        ok: true,
        zone,
        verified: true,
        ts: new Date().toISOString()
      });
    }

    return json({ ok:false, error:'not_found' }, 404);
  }
};

function json(obj, status=200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}
