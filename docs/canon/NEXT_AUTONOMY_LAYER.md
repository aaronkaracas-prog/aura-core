# CANON — Next Autonomy Layer (Queued)

Scope: Post-evidence engine.
Status: Queued (do not modify evidence subsystem unless a failing test proves regression).

## Next layers (in order)
- Command allowlist + strict parsing (no accidental triggers)
- Domain-scoped capability routing (per-host/tool gates)
- Operator-safe admin surface (explicit auth, no silent actions)

## Entry condition
RUN_SELF_TEST_EVIDENCE returns ok=true on staging + prod.
