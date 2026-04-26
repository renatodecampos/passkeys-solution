# Feedback Forward — RFC-0004

> Phase retrospectives for **RFC-0004** — Android Keystore binding + per-authentication audit (biometry signal PoC).  
> Cross-RFC token summary and insights: `tasks/feedback-forward.md`.

---

## Phase 1 — Server: auth audit + Keystore binding

**What went well**  
- Explicit `outDir`/`rootDir` in `tsconfig` stops `tsc` from dropping `.js` into `src/` and breaking Jest coverage on `.ts` sources.  
- Dedicated `webauthn-binding-challenge:` Redis prefix keeps binding proof separate from WebAuthn challenges.

**What caused friction / rework**  
- Stray `src/**/*.js` (from tsc with no `outDir`) produced 0% coverage until removed; Jest 30 + ts-jest 29 was a red herring.

**Suggested harness updates**  
| File | Change |
|------|--------|
| `passkeys-server/tsconfig.json` (or new-dev checklist) | Require `outDir: dist` + `rootDir: src` so `src` never contains emitted `.js`. |
| Jest / CLAUDE | Note that `collectCoverageFrom` `*.ts` is wrong if Jest loads co-located `*.js` in `src/`. |

**Applied?** `[x]` Applied in phase 3 — `CLAUDE.md` updated with tsconfig note; `tasks/feedback-forward.md` updated.

---

## Phase 2 — Android: Keystore + client payload

**What went well**  
- Server phase 1 API contract mapped cleanly to native module and `api.ts`.
- H1 confirmed on physical device — both `binding=ok` and `binding=lost` paths validated.

**What caused friction / rework**  
- Three Android bugs required iterative fixes during physical device validation:
  1. Keystore2 auth deferred to `sign()` time, not `initSign()` — required restructuring to always use BiometricPrompt after `initSign`.
  2. `BiometricPrompt.PromptInfo` missing `setNegativeButtonText` — threw `IllegalArgumentException` before prompt opened.
  3. `BiometricPrompt.authenticate()` called from RN background thread — threw `IllegalStateException`.
- `signKeystoreBindingChallenge` rejections surfaced as screen errors without console logs — wrapped in inner try/catch.

**Suggested harness updates**  
| File | Change |
|------|--------|
| `fase-2-android-keystore.md` | Add 3 Android Keystore/BiometricPrompt gotchas to subtask 2.1 notes (see Applied below) |

**Applied?** `[x]` Subtask 2.1 notes updated with all three fixes.

---

## Phase 3 — Documentation & close-out

**What went well**  
- Phase 3 scope was well-defined; all subtasks completed in a single session.
- Decision Record filled with confirmed/deferred open questions table.

**What caused friction / rework**  
- None significant.

**Suggested harness updates**  
| File | Change |
|------|--------|
| `_template-fase.md` | Add reminder to fill Phase 2 Notes/Feedback Forward before starting Phase 3 (they were left blank). |

**Applied?** `[ ]` Template update deferred.

---

## Phase 4 — Hardening (rate limit, revokedAt, PIN block)

**What went well**  
- All three hardening items were independent — implemented in a single session with no merge conflicts or ordering issues.
- `revokedAt` history design (query only `{ revokedAt: { $exists: false } }`) required no API contract changes and no client updates.
- PIN blocking is purely server-side — `bindingUnlockHint: "device_credential"` check in `evaluateBinding` required no native Android changes.

**What caused friction / rework**  
- PIN blocking path (4.3) is structurally unreachable on API 30+ emulators: `BiometricPrompt` with `BIOMETRIC_STRONG` never surfaces `device_credential` unlock, so the feature cannot be exercised in the standard test environment.

**Suggested harness updates**  
| File | Change |
|------|--------|
| `_template-fase.md` | When a subtask is emulator-unreachable, tag it `[emulator-only]` and clarify what "green" means without manual device confirmation. |

**Applied?** `[ ]` Template update deferred.
