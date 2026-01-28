# CANON — Command Allowlist + Strict Parsing (Locked)

System: Aura (aura-core)
Status: ACTIVE

## Behaviors
- Allowed commands respond deterministically:
  - PING -> PONG
  - SHOW_ALLOWED_COMMANDS -> JSON array
- Unknown single-token commands return: UNKNOWN_COMMAND
- Evidence engine behavior unchanged.
- Default safety gate remains:
  NOT WIRED: VERIFIED_FETCH REQUIRED

## Allowed commands (authoritative)
PING
SHOW_BUILD
SHOW_CLAIM_GATE
SHOW_ALLOWED_COMMANDS
RUN_SELF_TEST_EVIDENCE
VERIFIED_FETCH_URL
CLEAR_VERIFIED_FETCH
EVIDENCE_PRESENT
