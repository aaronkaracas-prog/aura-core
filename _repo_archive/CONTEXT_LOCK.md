\# CONTEXT LOCK — 2026-01-24 — arksystems.us



\## Proven working (do not re-litigate)

\- CityGuide.World is LIVE and proves Cloudflare + Workers + Aura model works end-to-end.

\- Workers, permissions, and Aura code are not the issue.



\## Current task (single focus)

\- Bind NEW domain instance: arksystems.us to worker aura-core.

\- Validate: /health and /ui once DNS resolves.



\## Current known config

\- Nameservers: yichun.ns.cloudflare.com, zoe.ns.cloudflare.com

\- Worker: aura-core

\- Workers Routes: arksystems.us/\* -> aura-core ; www.arksystems.us/\* -> aura-core



\## Forbidden actions

\- Do not recreate workers, tokens, rebuild Aura, redo CityGuide steps, or “start over”.



\## Next steps only

1\) Verify DNS status (public resolver)

2\) When DNS resolves, hit https://arksystems.us/health and /ui

3\) If NXDOMAIN persists: treat as propagation/caching/registry-level until proven otherwise

arksystems.us LIVE confirmed via --resolve on 2026-01-24 20:52 PT (HTTP 200 /health + /ui). Local DNS negative caching persists intermittently.

