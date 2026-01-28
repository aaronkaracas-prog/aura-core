AURA CLOUDFLARE CONTROL PLANE (aura-cloudflare)

This worker is the delegated Cloudflare mutation surface.
It holds the Cloudflare API token and only accepts signed requests from aura-core.

Endpoints:
- GET  /health                 (unauthenticated)
- POST /zone/inspect           (auth)
- POST /dns/upsert             (auth)
- POST /workers/route          (auth)

Auth:
Headers:
  X-Aura-TS: unix epoch seconds
  X-Aura-Sig: hex(hmac_sha256(AURA_CORE_SECRET, `${ts}\n${rawBody}`))

Hard rules:
- Allowed zones only (env.ALLOWED_ZONES CSV)
- No deletes
- No wildcards in DNS names
- Route patterns must end with "/*"
