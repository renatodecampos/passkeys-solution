# Feedback Forward — RFC-0001

> Phase retrospectives for RFC-0001 — Passkeys PoC wrap-up — local HTTPS + Android.
> Cross-RFC summary lives in `tasks/feedback-forward.md`.

---

## Phase 1 — Infrastructure and HTTPS

**What went well**
- Explicit parallelism map (1.1, 1.2, 1.5 in parallel) worked without conflicts
- Completion criterion with a real command (`curl -k`) was objective and verifiable

**What caused friction / rework**
- Environment variables in `.env-example` were outdated (`REDIS_HOST`/`REDIS_PORT` → `REDIS_URL`; `MONGODB_DATABASE` → `DB_NAME` + `COLLECTION_NAME`). The agent had to reconcile at runtime
- `RP_ORIGIN` in `.env-example` pointed to `http://localhost:3001` (no HTTPS, wrong port). Phase spec should have required consistency with `setup/index.ts`
- `mkcert -install` needs interactive sudo — not automatable; should have been tagged **[manual action]** on the subtask

**Suggested harness updates**
| File | Change |
|------|--------|
| `CLAUDE.md` | `.env-example` updated to real variable names |
| `CLAUDE.md` | Note on `mkcert -install` as manual step with password |

**Applied?** `[x]` Yes — phase 4 documentation

---

## Phase 1b — Server unit tests

**What went well**
- Real parallelism between 1b.2 and 1b.3 (registration and authentication) without conflicts
- Inline mock convention (no global `__mocks__`) was clear and reproducible
- Final coverage: 100% statements/functions, 84% branches — above threshold

**What caused friction / rework**
- Jest v29 renamed the flag: the subtask used `--testPathPattern` (singular); the installed version requires `--testPathPatterns` (plural). Extra work on the verification criterion
- `console.error` in the catch of `registration/index.ts` looks like an error in test output but is expected — confusing when reading the test report

**Suggested harness updates**
| File | Section | Suggested change |
|------|---------|------------------|
| `AGENTS.md` | Section 6 (Tests) | Document Jest v29+ uses `--testPathPatterns` (plural) |
| `_template-fase.md` | Template notes | Reminder: check installed version flags before fixing commands in the spec |

**Applied?** `[x]` Yes — feedback-forward RFC-0002 (AGENTS.md §6; CLAUDE.md Tests)

---

## Phase 2 — Android app

**What went well**
- Splitting the native chain (2.1→2.2→2.3→2.4) from the service chain (2.5→2.8) into two parallel sub-agents worked well
- `react-native-passkey` v3.3.3 works with Expo SDK 53 / RN 0.79 without tweaks

**What caused friction / rework**
- `ts-node` was not listed as a setup dependency; found when running `jest.config.ts` in TypeScript. Should have been in the 2.8 spec
- Final check for `npx expo run:android` stayed "pending" — needs a physical/emulated device the agent cannot drive alone. Hardware-dependent subtasks should be **[manual action]**
- Gradle blocker (7.3.3 incompatible with Expo SDK 53) only surfaced in phase 3; the 2.2 spec (`expo prebuild`) should have required checking `sdkVersion` in `app.json`
- Route architecture (`app/index.tsx` vs `app/(tabs)/index.tsx`) was underspecified — navigation blocker fixed in phase 3

**Suggested harness updates**
| File | Section | Suggested change |
|------|---------|------------------|
| `AGENTS.md` | Section 4 (App) | Add: verify `sdkVersion` in `app.json` before `expo prebuild` |
| `CLAUDE.md` | App setup | Document `ts-node` as a devDependency for TypeScript `jest.config.ts` |
| `_template-fase.md` | Template | Mark hardware-dependent subtasks as **[manual action]** |

**Applied?** `[x]` Yes — feedback-forward RFC-0002 (AGENTS.md §4: sdkVersion + `home.tsx` route; CLAUDE.md: ts-node; `_template-fase.md`: [manual action] tag)

---

## Phase 3 — Integration and E2E

**What went well**
- Parallelism map (3.1, 3.2, 3.3 at once) reduced phase latency
- A "common troubleshooting" section in Notes grew organically — worth standardizing

**What caused friction / rework** ⚠️ (4 blockers in this phase — sign of gaps in earlier phases)
- Debug keystore path in the spec was wrong: spec said `~/.android/debug.keystore`; actual is `passkeys-app/android/app/debug.keystore`
- `ANDROID_ORIGIN` (`android:apk-key-hash:...`) was not in the initial harness; only found when running the real flow. Should be in phase 1 spec or `.env-example`
- Empty body in `generate-authentication-options` — bug in `services/api.ts` that phase 1b unit tests did not cover (test mocked fetch, did not assert request body)
- Logout navigation stuck — route architecture underspecified in phase 2; fixed by moving home to `app/home.tsx`

**Suggested harness updates**
| File | Section | Suggested change |
|------|---------|------------------|
| `CLAUDE.md` | Env vars | Document `ANDROID_ORIGIN` and how to compute `apk-key-hash` |
| `CLAUDE.md` | Setup | Fix debug keystore path to `passkeys-app/android/app/debug.keystore` |
| `AGENTS.md` | Section 4 (App) | Rule: authenticated home uses `app/home.tsx`, not `app/(tabs)/index.tsx` |
| `AGENTS.md` | Section 6 (Tests) | `services/api.ts` tests must assert fetch body, not only response |

**Applied?** `[x]` Yes — feedback-forward RFC-0002 (AGENTS.md §4: `home.tsx` route; §6: body validation)

---

## Phase 4 — Documentation

**What went well**
- "Document only what is not obvious" kept `CLAUDE.md` short
- Reading `## Notes` from earlier phases was enough to produce `CLAUDE.md`

**What caused friction / rework**
- Several insights from phase Notes were "lost" at doc time for lack of a persistent log — this file (`feedback-forward.md`) fixes that

**Suggested harness updates**
| File | Section | Suggested change |
|------|---------|------------------|
| `_template-fase.md` | New section | Add `## Feedback Forward` as required before `[x] completed` |
| `AGENTS.md` | New section | Rule: fill `## Feedback Forward` and update `tasks/feedback-forward.md` when a phase ends |
| `tasks/README.md` | Reference | Mention `feedback-forward.md` as cross-RFC log |

**Applied?** `[x]` Yes — this file
