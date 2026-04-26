# Phase 1 — Server: auth audit + Keystore binding (RFC-0004)

**Phase status**: `[x] completed`  
**Owning agent**: Cursor Agent  
**Started at**: `2026-04-25T00:00:00Z`  
**Completed at**: `2026-04-25` (see **Token usage**)

---

## Prerequisite

None (first phase of RFC-0004). Baseline: prior RFCs’ server/app work is merged; `passkeys-server` tests pass on `main` before starting (optional smoke: `cd passkeys-server && npm test`).

### RFC alignment (read on disk)

Before coding, read `rfcs/draft/RFC-0004-android-keystore-auth-audit-biometry-signal.md`:

- **Technical design** (data model, API, two challenges in Redis)
- **Success metrics (PoC)**
- **PoC limitations** (e.g. `binding_lost` ≠ attacker; two challenges must not be mixed or replayed; `auth_attempts` noise)
- **Open questions** — especially **5–11** (PIN vs biometry metadata, retention/PII, abuse/noise, GPM/restore, `schemaVersion`)

---

## Completion criterion

```bash
cd passkeys-server && npm test
# All tests pass; Jest includes new tests for auth attempts + binding verification shape / flag.
```

Additional manual or integration check (document in **Notes** if automated later):

- After a test request path, MongoDB `auth_attempts` collection accepts inserts with expected field shape, or a unit/integration test proves the same without a live DB.

The phase is complete only when the command above succeeds and subtasks are verified.

---

## Subtasks

### 1.1 — Data layer: `auth_attempts` + `keystore_binding`
- **Status**: `[x] completed`
- **depends_on**: []
- **Files**: `passkeys-server/src/infra/database/database.ts` (or split module per project convention)
- **What to do**: Add persistence for `auth_attempts` and `keystore_binding` per RFC **Technical design**, plus: **`schemaVersion`** on both document types (Open Q11 — comparable exports). Optional PoC field **`bindingUnlockHint`** (or name TBD) if client sends a **non-security** class of unlock (e.g. `biometric` \| `device_credential`) to support **Open Q5**; if not implemented, store `null` and document the gap in **Notes / Feedback Forward**. Minimize PII in attempt rows per **Open Q7** (purpose: research PoC). Add indexes as in the RFC.
- **Verification**: Unit tests with mocked DB or integration test; `insertAuthAttempt` / `upsertKeystoreBinding` callable from authentication layer; documents include `schemaVersion`.

### 1.2 — Config: `AUTH_DENY_ON_BINDING_LOST`, binding challenge in Redis
- **Status**: `[x] completed`
- **depends_on**: [1.1]
- **Files**: `passkeys-server/src/setup/index.ts`, `infra/database/redis.ts` (or equivalent)
- **What to do**: Read `AUTH_DENY_ON_BINDING_LOST` (default `false`). Implement short-TTL, one-time **binding challenge** storage (reuse Redis challenge pattern; key prefix distinct from WebAuthn).
- **Verification**: Jest for env default; challenge set/get/expire if exposed via pure functions or integration test.

### 1.3 — API + authentication: log every attempt; verify optional `binding` proof
- **Status**: `[x] completed`
- **depends_on**: [1.1, 1.2]
- **Files**: `passkeys-server/src/infra/api/index.ts`, `authentication/index.ts` (and registration if “store binding public key” is a new route)
- **What to do**: On `getAuthenticationOptions` (or dedicated route), return/include **binding challenge** for PoC. **Binding challenge** key prefix and payload must be **separate** from WebAuthn (PoC **limitations**: no cross-use or replay between the two). On verify-authentication: run existing WebAuthn verify; **if applicable**, verify optional `binding` signature over the **binding** challenge only; compute `bindingOutcome` (`ok` | `lost` | `not_present` | `error` | `skipped`); **always** write `auth_attempt` for both WebAuthn **success** and **failure** — on WebAuthn failure, set `bindingOutcome` to `skipped` (or `not_present`) if binding was not evaluated. If `AUTH_DENY_ON_BINDING_LOST` and outcome is `lost`, apply policy. Response body includes `authAttemptId` / `biometryBindingStatus` per RFC. **Open Q10:** if stale `keystore_binding` reconciliation is out of scope, record in **Notes** (deferred follow-up).
- **Verification**: Jest: **WebAuthn failure** still writes an attempt; **WebAuthn success** + missing binding → `skipped` or `not_present`; tests prove binding and WebAuthn challenges are not interchangeable; feature flag behavior covered.

### 1.4 — Jest: binding crypto + row shape
- **Status**: `[x] completed`
- **depends_on**: [1.3]
- **Files**: `passkeys-server/src/**/*.test.ts` or `__tests__/` as existing
- **What to do**: Tests for signature verification with a **fixture** public key, attempt document shape (including `schemaVersion`), and `AUTH_DENY_ON_BINDING_LOST` branches.
- **Verification**: `npm test` green; coverage for new code per project threshold.

### 1.5 — [Optional] Abuse / noise: rate limit on `auth_attempt` inserts
- **Status**: `[-] skipped` — PoC timeboxed; Open Q9 (rate limit / dedupe) deferred to a later hardening pass; global Fastify rate limit still applies to routes.
- **depends_on**: [1.3]
- **Files**: `infra/api/index.ts` (middleware or route guard), `setup` if new env vars
- **What to do**: Per **Open Q9** and **PoC limitations** (volume noise): consider **rate limiting** or **deduplication** of inserts per IP and/or per userId for the authentication routes. If **not** implemented, document why (PoC only) in **Notes** and list as follow-up in **Feedback Forward**.
- **Verification**: If implemented, Jest or integration test for 429/limited behavior; if skipped, explicit `[-] skipped` line in this subtask with reason.

---

## Parallelism map

```
1.1 ─┐
     ├→ 1.2, 1.3 (1.1 first; 1.2 and 1.3 partially parallel after 1.1)
1.4 depends on 1.3
1.5 optional after 1.3
```

**Practical order:** 1.1 → 1.2 → 1.3 → 1.4; **1.5** optional if time (Open Q9).

---

## Orchestrator instructions

> Read when you run `/feature-dev execute RFC-0004 phase 1`

**Precondition:** N/A (first phase). Read the RFC: **Technical design**, **PoC limitations**, **Open questions** (5–11), and **Success metrics**.

**On start:** Set **Phase status** to `[~] in_progress`, **Owning agent**, **Started at** (ISO).

### BATCH A — sequential
**Agent — Server data + config**
- Complete 1.1, then 1.2, 1.3, 1.4 in dependency order. Mark subtasks `[~] in_progress` / `[x] completed` / `[!] blocked` as you go.

### Wrap-up
- Run **Completion criterion**; fix until green.
- Per `AGENTS.md` §2: ask the user for token usage before `[x] completed`; fill **Token usage**; update `tasks/feedback-forward.md` **Token summary**; **Feedback Forward** here and in `tasks/rfc-0004/feedback-forward.md`.
- If success: show user  
  `To continue, open a new context window and run: /feature-dev execute RFC-0004 phase 2`

---

## Blockers

_No blockers recorded._

---

## Notes

- **Open Q5 / `bindingUnlockHint`:** `auth_attempts` includes optional `bindingUnlockHint` (values `biometric` \| `device_credential` \| `null`); the server accepts it on verify if the client sends it—Phase 2 can populate. Otherwise stored as `null`.
- **Open Q10 (stale `keystore_binding` / GPM restore):** No reconciliation in this phase—`upsertKeystoreBinding` replaces by `userId` only; follow-up: document `revokedAt` or multi-row policy when Phase 2 defines client behavior.
- **Open Q7 (PII):** Attempt rows store `userId` (app subject id), optional `appVersion` / `androidSdk` fields are reserved; not required in PoC payloads yet.
- **Tooling:** `tsc` was emitting `.js` next to `.ts` (no `outDir`), which broke Jest coverage (0% on `.ts`). Fixed with `rootDir`/`outDir` in `tsconfig.json` and removed stray `src/**/*.js`. Jest aligned to 29.x with `ts-jest` 29.
- **`generate-authentication-options` response:** Public API response now includes `bindingChallenge` (base64url) alongside WebAuthn options; Redis keys `webauthn-binding-challenge:{username}` vs `challenge:{username}-authentication` are not interchangeable.
- **`verify-authentication` response:** `{ verified, authAttemptId, biometryBindingStatus }`.

---

## Feedback Forward

### What went well
- Single `tsc` layout (`outDir: dist` / `rootDir: src`) prevents stray `src/**/*.js` that silently breaks ts-jest coverage.
- `binding-crypto` + fixture tests give confidence on SPKI P-256 / Ed25519 without device.

### What caused friction / rework
- Discovered 0% Jest coverage until stray compiled `.js` in `src/` were removed; root cause was `tsconfig` without `outDir` (emission beside sources).

### Suggested harness updates

| File | Section | Suggested change |
|------|---------|------------------|
| `passkeys-server/tsconfig.json` | emit | Set `rootDir` + `outDir` in template / CLAUDE so `npm run build` never pollutes `src/`. |
| `CLAUDE.md` | Tests | Note Jest + ts-jest major alignment (e.g. Jest 29 with ts-jest 29). |

### Applied?
`[x]` Applied in phase 3 — `CLAUDE.md` updated with tsconfig note; `tasks/feedback-forward.md` updated.

---

## Token usage

| Field | Value |
|-------|-------|
| Tool | Cursor |
| Tokens consumed | ~113k |
| Context window % | 56% |
| Notes | User-reported; within recommended ≤75% context window. |
