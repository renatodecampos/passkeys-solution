# Phase 2 — Android: Keystore binding + client payload (RFC-0004)

**Phase status**: `[x] completed`  
**Owning agent**: Cursor Agent (code) + Claude Code Sonnet 4.6 (bug fixes + manual PoC)  
**Started at**: `2026-04-25T12:00:00Z` (approx.)  
**Completed at**: `2026-04-26`

---

## Prerequisite

`tasks/rfc-0004/fase-1-server-audit-binding.md` must be `[x] completed` (server exposes binding challenge + verify payload + `auth_attempts` persistence). Read that file and re-run `cd passkeys-server && npm test` if unsure.

**RFC read:** `rfcs/draft/RFC-0004-...md` — **PoC limitations** (emulator vs device; `binding_lost` not equal to attacker; PIN vs biometry) and **Open questions 5–8** (unlock method, fallback, ground truth for lab notebook).

---

## Completion criterion

```bash
cd passkeys-app && npm test
# Jest passes (including any new tests for api.ts binding fields).
```

**Plus** **manual** PoC on Android emulator (cannot be fully automated in CI without device farm):

- Register passkey → authenticate → **MongoDB** shows `auth_attempts` with `bindingOutcome` consistent with `ok` (or `skipped` if binding not yet sent, per server policy — **goal** of PoC is `ok` after wire-up).
- Settings → add fingerprint → authenticate again → new row with `bindingOutcome` = `lost` (or `error`) as defined in phase 1 when the Keystore key is invalidated.
- **If** H1 is **not** observed (no `lost` after add-fingerprint) on a given **API level / image**, **document** as **inconclusive or negative** for that matrix row per RFC **PoC limitations** (OEM variance) — not as “green PoC” without a note.
- **Optional (Open Q8):** add a one-line **lab log** (in **Notes** or `poc-checklist-executed.md`) when enrollment was changed **by script** (e.g. “Settings → Security → fingerprint add”) to separate **inference** from a **labeled** test step.
- **Emulator only:** state **API level** and that external validity to physical devices is **out of band** (same RFC **PoC limitations**).

The phase is complete when `npm test` passes **and** the manual checklist is recorded in **Notes** (screenshots/DB excerpts optional) or a short `tasks/rfc-0004/poc-checklist-executed.md` if the team adds one.

---

## Subtasks

### 2.1 — Native: Keystore key + sign challenge **[manual action] for emulator test**
- **Status**: `[x] completed`
- **depends_on**: []
- **Files**: `passkeys-app/android/...` (Kotlin), or Expo **native module** (document exact path in Notes)
- **What to do**: After successful passkey **registration**, generate Android Keystore key with `setUserAuthenticationRequired(true)` and `setInvalidatedByBiometricEnrollment(true)`; export public key to server (new endpoint or extended registration). On auth: read **binding challenge** from server; **present user authentication** (per device policy the **user may use PIN/pattern** instead of biometry — RFC **PoC limitations** and **Open Q5–6**); sign challenge; optionally pass a **client hint** for unlock class to the API if subtask 1.1 added `bindingUnlockHint` (or defer with Note). Handle `KeyPermanentlyInvalidatedException` and map to client payload for `binding_lost`. Do not label the flow “biometry-only” in copy unless the app **restricts** to biometrics in code and documents the trade-off (**Open Q6**).
- **Verification**: On emulator, key exists; public key registered on server; sign succeeds pre–fingerprint-add; if tested with **PIN** path, record observation in **Notes** (supports Open Q5).

### 2.2 — `services/api.ts`: binding + auth verify body
- **Status**: `[x] completed`
- **depends_on**: [2.1]
- **File**: `passkeys-app/services/api.ts`
- **What to do**: Extend calls to `getAuthenticationOptions` / verify to pass **binding** fields; no `fetch` outside this file. Tests assert **bodies/headers** sent (per `AGENTS.md` testing rules).
- **Verification**: `npm test` in `passkeys-app`; assertions on `fetch` args.

### 2.3 — `app/index.tsx` (or sole passkey entry): wire flows
- **Status**: `[x] completed`
- **depends_on**: [2.1, 2.2]
- **File**: `passkeys-app/app/index.tsx` (and only if needed: `home.tsx` — avoid breaking route rules in `AGENTS.md`)
- **What to do**: After registration success, call native binding setup + server upload. Before/during auth, obtain challenge, sign, attach to verify. Display debug label or log in dev for `biometryBindingStatus` if useful for PoC.
- **Verification**: Manual: full flow; **project rule**: do not use `app/(tabs)/index.tsx` as passkey home target.

### 2.4 — `npx expo prebuild` if native files added
- **Status**: `[x] completed` (native edits under existing `android/`; `./gradlew :app:compileDebugKotlin` green; run `npx expo prebuild --platform android --clean` only if a clean regen of `android/` is required)
- **depends_on**: [2.1]
- **What to do**: If native code/modules changed, `npx expo prebuild --platform android --clean` per `CLAUDE.md`; confirm `sdkVersion` in `app.json` matches project Expo SDK.
- **Verification**: `npx expo run:android` installs on emulator (manual or CI with emulator).

---

## Parallelism map

```
2.1 — first
2.2 depends on 2.1
2.3 depends on 2.1, 2.2
2.4 with 2.1 (after native edits)
```

---

## Orchestrator instructions

> Read when you run `/feature-dev execute RFC-0004 phase 2`

**Precondition:** Read `tasks/rfc-0004/fase-1-server-audit-binding.md` on disk; status `[x] completed`.

**On start:** Set **Phase status** to `[~] in_progress`, **Owning agent**, **Started at** (ISO).

### BATCH A
- Implement 2.1 → 2.2 → 2.3; run 2.4 when native tree changes.
- **Manual** emulator steps for completion criterion: document under Notes.

### Wrap-up
- Token usage per `AGENTS.md` §2; Feedback Forward; `tasks/feedback-forward.md` Token summary.
- On success:  
  `To continue: /feature-dev execute RFC-0004 phase 3`

---

## Blockers

_No blockers recorded._

---

## Notes

**Implementation (2026-04-25):**

- **Native:** `KeystoreBindingModule` / `KeystoreBindingPackage` — EC P-256, `setUserAuthenticationRequired`, `setInvalidatedByBiometricEnrollment`, SPKI to server, `SHA256withECDSA` sign over **UTF-8** binding challenge (matches server `messageUtf8`). `androidx.biometric` added. Package registered in `MainApplication.kt`.
- **JS:** `services/keystoreBinding.ts` (android-only), `api.ts` — `registerKeystoreBinding`, `verifyAuthentication` with optional `binding` + `bindingUnlockHint`. `app/index.tsx` — post-reg binding upload; sign-in: strip `bindingChallenge` from passkey options, sign then `Passkey.get`. `home` shows `biometryBinding` when present.
- **Tests:** `passkeys-app` Jest — fetch body assertions for binding + `registerKeystoreBinding`.

**Manual (owner):** Fill `poc-checklist-executed.md` after emulator run; if H1 not observed on a given image, mark inconclusive per RFC.

---

## Feedback Forward

### What went well
- Server phase 1 contract (`/register-keystore-binding`, `bindingChallenge` on auth options) mapped cleanly to native + `api.ts`.
- H1 confirmed on physical device (Samsung SM-A165M, API 36) — both happy path (`binding=ok`) and suspicious path (`binding=lost`, app blocked).

### What caused friction / rework
- `Passkey.get` must not receive `bindingChallenge`; strip before the WebAuthn call.
- Three Android-layer bugs found during physical device validation (not emulator): Keystore2 auth-at-finish-time, missing BiometricPrompt negative button text, and UI thread violation. All fixed in Claude Code session 2026-04-26.
- Logging gap: `signKeystoreBindingChallenge` rejections propagated to the outer catch and showed as screen errors without console output; wrapped in inner try/catch.

### Suggested harness updates

| File | Section | Suggested change |
|------|---------|------------------|
| `fase-2-android-keystore.md` | Subtask 2.1 | Add note: on API 31+ (Keystore2), `initSign` succeeds but `sign()` may throw `KEY_USER_NOT_AUTHENTICATED`; always route through `BiometricPrompt` after `initSign`. |
| `fase-2-android-keystore.md` | Subtask 2.1 | Add note: `BiometricPrompt.PromptInfo` with `BIOMETRIC_STRONG` requires `setNegativeButtonText` — missing it throws `IllegalArgumentException` silently caught. |
| `fase-2-android-keystore.md` | Subtask 2.1 | Add note: `BiometricPrompt` must be called from the main/UI thread; `@ReactMethod` runs on background thread — dispatch via `act.runOnUiThread`. |

### Applied?
`[x]` Applied in phase 3 — CLAUDE.md documents PoC checklist, limitations, and collections.

---

## Token usage

| Field | Value |
|-------|-------|
| Tool | — |
| Tokens consumed | — |
| Context window % | — |
| Notes | — |
