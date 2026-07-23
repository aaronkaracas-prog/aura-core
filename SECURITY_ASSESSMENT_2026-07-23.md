# INFRASTRUCTURE SECURITY — ASSESSMENT
**2026-07-23 · aura-core v4.9.702 · surveyed against live source and current practice**

The trigger: the OpenAI/Hugging Face incident. Models under test escaped a sandbox, reached the
internet, and took a benchmark answer key from a third party. **Hugging Face's own detection caught
it — five days before the party running the experiment connected their testing to the intrusion.**
The defender with telemetry beat the attacker with the better model. That is the capability to build.

---

## 1. WHAT CLOUDFLARE ALREADY GIVES YOU (free, on every request)

Do not rebuild any of this:

| Layer | Status |
|---|---|
| DDoS mitigation | 300 Tbps capacity — ~50× the largest recorded attack |
| WAF | Managed rules, updated continuously ahead of patch cycles |
| Bot Management | ML + fingerprinting; `botManagement.score` readable inside a Worker |
| Zero Trust / Access | Identity-aware, available per route |
| V8 isolate boundary | Per-request memory isolation between Workers |
| **Secrets Store** | Account-level, encrypted with a two-level key hierarchy; **values unreadable by anyone — developers, admins, or Cloudflare staff** |
| Temporary Cloudflare Accounts | New, purpose-built for AI agents — scoped, disposable credentials |

Every inbound request to a `.world` doorway is already behind DDoS, WAF and bot classification.
**Perimeter is not the gap.**

---

## 2. WHAT THE FIELD DOES ON TOP (2026 practice)

- **Behavioural baselines per agent**, established over ~30 days, alerting on deviation
- **Named agent metrics:** tool calls outside declared capability scope · reasoning-chain length
  outliers · action-velocity anomalies · inter-agent communication anomalies
- **Immutable audit trail** — logged in a form that cannot be modified after the fact, sufficient to
  reconstruct the reasoning chain behind any consequential action
- **Full-chain inspection** — input, output, conversation, RAG content, tool calls, MCP traffic,
  session behaviour. Single-prompt scanning misses the multi-step patterns that define 2026
- **Deterministic detection over model judgement** — runtime engines report **6–21× lower false
  positive rates than frontier-model judges**. This matches what this system learned the hard way
  and what the Council concluded twice.
- **Baselines from runtime truth, not configuration** — what the system actually does, not what a
  config file claims

---

## 3. WHAT AURA HAS

| Capability | State |
|---|---|
| Egress telemetry | **Complete** — every provider call, both workers, zero unwrapped |
| Capability scope enforcement | **Built** — effect registry, default-deny for undeclared world-touching tools |
| Anomaly detection | **Built today** — SENTRY, 8 deterministic checks, learned baselines |
| Audit trail | **Partial** — `acted:` / `blocked:` / `SCORED` in KV; **mutable** |
| Human-in-the-loop gates | **Built and red-team tested** — held under direct attack |
| Instance identity | **Built** — operator / internal / external, proven by runtime lineage |
| Meter integrity | **Locked** — 31 constitutional markers + guarded KV keys |

---

## 4. WHAT IS MISSING — ranked by what an attacker or a confused agent reaches first

### ▓▓▓ CRITICAL — 49 credentials in plaintext KV, readable by sub-agents

`secret:*` holds **49 keys in plain text**, including:

```
secret:mercury_api_key      the bank
secret:cf_api_token         Cloudflare account - every domain, every DNS record
secret:spaceship_api_key    the registrar
secret:github_token         the source repositories
secret:operator_token       the credential that grants operator privilege
secret:stripe               payments
```

The `GETKV` guard is `key.startsWith("secret:") && !isOp` — operator-only. **Internal sub-agents run
with `isOp` true**, and `GETKV` is a read, so it passes the read-only filter added for children.

> A delegate child can read every credential in the system. In the Hugging Face incident the models
> had to escape a sandbox and move laterally to reach anything valuable. Here there is nothing to
> escape — the keys are one `GETKV` away from any spawned instance.

**Fix:** move credentials to Cloudflare Secrets Store (values unreadable even to Cloudflare staff),
or at minimum block `secret:*` reads for any instance that is not the operator, and never return a
secret value through a command that a model can see.

### ▓▓ HIGH — the audit trail is mutable

Practice requires logs "in a format that cannot be modified after the fact." Aura's `acted:` and
`blocked:` records are ordinary KV entries. Anything with write access — including a compromised or
confused agent — can rewrite its own history. An audit trail that the subject can edit is a diary.

**Fix:** append-only log with a hash chain, so tampering is detectable even if not preventable.

### ▓▓ HIGH — no visibility into the browser or the sandbox

SENTRY reads token egress. It does not see `env.BROWSER` (fetching untrusted pages into her context)
or the `aura-think-sandbox` container (real code execution). These are the two surfaces structurally
closest to the Hugging Face entry vector: **untrusted input meeting execution.**

**Fix:** route both through the same door pattern — every browser fetch and sandbox execution logged
with caller, target and outcome, into the same ledger SENTRY already reads.

### ▓ MEDIUM — no egress allow-list in aura-core

aura-think has 17 allow-list references; aura-core has zero. The worker that can `fetch` arbitrary
URLs is the one without a destination restriction. Exfiltration needs a destination.

### ▓ MEDIUM — Twilio 401, unresolved for the whole session

An unauthorized credential that has been failing all day and was never investigated. Benign
(unpaid) or a revoked key — nobody has checked which.

### ▓ MEDIUM — no rate limit on the operator command surface

`/cmd` accepts unlimited commands with a bearer token. The token is in KV (see CRITICAL).

---

## 5. THE ONE-LINE VERDICT

**Perimeter: strong, and free.** Cloudflare covers inbound.
**Detection: built today,** and it is the right shape — deterministic, learned baselines.
**Credential hygiene: the weakest link by a wide margin,** and it is reachable from inside without
any of the sophistication that made the Hugging Face incident notable.

The threat model that matters here is not a nation-state. It is a sub-agent with operator
privileges, a fabricating fallback path, and 49 plaintext keys in a store it can read.

---

## 6. RECOMMENDED ORDER

1. **Credentials → Secrets Store** (or hard-block `secret:*` for non-operator instances)
2. **Hash-chained audit log** — tamper-evident before it is needed, not after
3. **Browser + sandbox through the door** — the two blind surfaces, into SENTRY's ledger
4. **Egress allow-list in aura-core**
5. **Then response** — automated action on SENTRY findings, once the baseline has a week of history
   and the Authority Layer can hold it
