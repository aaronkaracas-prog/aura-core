# CANON — Deterministic Verified Evidence Engine (Locked)

System: Aura (Cloudflare Worker: aura-core)
Branch: staging
Commit: 52b43ad
Date locked: 2026-01-28

## Guaranteed behaviors (authoritative)
- Evidence is host-scoped and persisted in KV.
- Gating string is exact when evidence is absent:
  NOT WIRED: VERIFIED_FETCH REQUIRED
- Multi-host CLEAR in one message clears ALL targeted hosts and returns once (CLEARED).
- Host-targeted answering: a message cannot answer for host B using lastEvidence from host A.
- Message ordering is deterministic:
  CLEAR_VERIFIED_FETCH runs first, then VERIFIED_FETCH_URL, then answers.
- If a message contains a reachability question, Aura answers that question (does not early-return CLEARED).
- Clears-only messages return CLEARED.

## Acceptance tests (prod)
- CLEAR + question (no fetch) gates.
- VERIFIED_FETCH_URL + shaped response returns YES/NO deterministically.
- CLEAR + VERIFIED_FETCH_URL + question returns answer (e.g., example.com -> YES).
- VERIFIED_FETCH_URL host A + question host B gates unless B evidence exists.
