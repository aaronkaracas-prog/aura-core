export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/chat") {
      return new Response("Not Found", { status: 404 });
    }

    const body = await request.text();
    const lines = body.split("\n").map(l => l.trim()).filter(Boolean);

    const normalizeHost = (u) => {
      try {
        return new URL(u).host.toLowerCase();
      } catch {
        return null;
      }
    };

    const evidenceKey = (host) => `verified_fetch:${host}`;
    const statusReachable = (st) => Number(st) >= 200 && Number(st) < 400;

    const extractLastUrl = (txt) => {
      const matches = [...txt.matchAll(/https?:\/\/[^\s]+/g)];
      return matches.length ? matches[matches.length - 1][0] : null;
    };

    let lastEvidence = null;

    // 1) Collect immediate commands and apply CLEARs FIRST (so CLEAR + VERIFIED_FETCH in one message works)
    const hasReachabilityQuestion = /\breachable\b/i.test(body);
    const clearHosts = [];
    const evidenceHosts = [];
    let hasVerifiedFetchCommand = false;

    for (const line of lines) {
      if (line.startsWith("CLEAR_VERIFIED_FETCH")) {
        const parts = line.split(" ").filter(Boolean);
        const target = parts[1];
        const host = normalizeHost(target);
        if (host) clearHosts.push(host);
        continue;
      }

      if (line.startsWith("EVIDENCE_PRESENT")) {
        const parts = line.split(" ").filter(Boolean);
        const target = parts[1];
        const host = normalizeHost(target);
        evidenceHosts.push(host); // may be null => missing
        continue;
      }

      if (line.startsWith("VERIFIED_FETCH_URL")) {
        hasVerifiedFetchCommand = true;
      }
    }

    const didClear = clearHosts.length > 0;
    if (didClear) {
      for (const host of clearHosts) {
        await env.AURA_KV.delete(evidenceKey(host));
      }
    }

    // 2) Execute any VERIFIED_FETCH_URL commands in THIS message (may be multiple)
    for (const line of lines) {
      if (line.startsWith("VERIFIED_FETCH_URL")) {
        const parts = line.split(" ").filter(Boolean);
        const target = parts[1];
        const host = normalizeHost(target);
        if (!host) continue;

        try {
          const res = await fetch(target);
          const text = await res.text();

          const evidence = {
            ok: true,
            url: target,
            host,
            http_status: res.status,
            first_line_html: text.split("\n")[0] || "",
            body_length: text.length
          };

          await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
          lastEvidence = evidence;
        } catch {
          const evidence = {
            ok: false,
            url: target,
            host,
            http_status: 0
          };
          await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
          lastEvidence = evidence;
        }
      }
    }

    // 3) If there's NO reachability question, we may still need to answer EVIDENCE_PRESENT or CLEARED.
    // IMPORTANT: if the message includes VERIFIED_FETCH_URL + a response-shape instruction, we must NOT return CLEARED early.
    if (!hasReachabilityQuestion) {
      if (evidenceHosts.length) {
        const host = evidenceHosts[0];
        if (!host) return Response.json({ ok: true, reply: "EVIDENCE_MISSING" });

        const stored = await env.AURA_KV.get(evidenceKey(host));
        return Response.json({ ok: true, reply: stored ? "EVIDENCE_PRESENT" : "EVIDENCE_MISSING" });
      }

      // Clears-only message: reply once, deterministically.
      if (didClear && !hasVerifiedFetchCommand) {
        return Response.json({ ok: true, reply: "CLEARED" });
      }
    }

    // 4) Inline response shapes (answer from VERIFIED_FETCH_URL executed in THIS message when it matches the asked host)
    const wantYesNo = /return\s+only\s*:\s*yes\s+or\s+no\b/i.test(body);
    const wantReachableUnreachable = /return\s+only\s*:\s*reachable\s+or\s+unreachable\b/i.test(body);
    const want200or000 = /return\s+only\s*:\s*200\s+or\s+000\b/i.test(body);
    const wantHttpStatus = /return\s+only\s+the\s+http_status\b/i.test(body);

    const askedUrl = extractLastUrl(body);
    const askedHost = askedUrl ? normalizeHost(askedUrl) : null;

    if (lastEvidence && askedHost && lastEvidence.host === askedHost) {
      const st = Number(lastEvidence.http_status || 0);
      const r = statusReachable(st);

      if (wantHttpStatus) return Response.json({ ok: true, reply: String(st) });
      if (want200or000) return Response.json({ ok: true, reply: (st === 200 ? "200" : "000") });
      if (wantReachableUnreachable) return Response.json({ ok: true, reply: (r ? "REACHABLE" : "UNREACHABLE") });
      if (wantYesNo) return Response.json({ ok: true, reply: (r ? "YES" : "NO") });
    }

    // 5) Evidence-memory reachability path
    if (/\breachable\b/i.test(body)) {
      if (!askedUrl) return Response.json({ ok: true, reply: "NOT WIRED: VERIFIED_FETCH REQUIRED" });
      if (!askedHost) return Response.json({ ok: true, reply: "NOT WIRED: VERIFIED_FETCH REQUIRED" });

      const stored = await env.AURA_KV.get(evidenceKey(askedHost));
      if (!stored) return Response.json({ ok: true, reply: "NOT WIRED: VERIFIED_FETCH REQUIRED" });

      const evidence = JSON.parse(stored);
      const st = Number(evidence.http_status || 0);
      const r = evidence.ok && statusReachable(st);

      if (wantReachableUnreachable) return Response.json({ ok: true, reply: (r ? "REACHABLE" : "UNREACHABLE") });
      if (wantYesNo) return Response.json({ ok: true, reply: (r ? "YES" : "NO") });

      return Response.json({ ok: true, reply: r ? "YES" : "NO" });
    }

    if (body === "SHOW_BUILD") {
      return Response.json({
        ok: true,
        reply: JSON.stringify({ build: "AURA_CORE__DETERMINISTIC_EVIDENCE__02", stamp: new Date().toISOString() }, null, 2)
      });
    }

    if (body === "SHOW_CLAIM_GATE") {
      return Response.json({
        ok: true,
        reply: JSON.stringify({
          trigger_words: ["live","deployed","launched","resolving","propagating","successful","verified","up","online","working","reachable","available","accessible"],
          forced_message: "NOT WIRED: VERIFIED_FETCH REQUIRED",
          requires_verified_fetch_format: true
        }, null, 2)
      });
    }

    return Response.json({ ok: true, reply: "NOT WIRED: VERIFIED_FETCH REQUIRED" });
  }
};
