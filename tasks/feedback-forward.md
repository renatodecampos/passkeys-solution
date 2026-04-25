# Feedback Forward — cross-RFC log

> Each completed phase adds an entry here. This file is read in each RFC’s Documentation phase
> and drives updates to `AGENTS.md`, `CLAUDE.md`, and `_template-fase.md`.
>
> Agent: fill your phase section before marking `[x] completed`.

---

## Token summary

> Updated by the agent at the end of each phase.
> **Recommended limit: ≤ 75% context window.** Above that, risk of silent errors increases
> (instructions dropped, wrong file edited). Plan a new context window before reaching 75%.

| RFC | Phase | Tool | Tokens | Context % |
|-----|-------|------|--------|-----------|
| RFC-0001 | 1 | — | — | — |
| RFC-0001 | 1b | — | — | — |
| RFC-0001 | 2 | — | — | — |
| RFC-0001 | 3 | — | — | — |
| RFC-0001 | 4 | — | — | — |
| RFC-0002 | 1 | — | — | — |
| RFC-0002 | 2 | Cursor | ~109k | 54.3% |
| RFC-0002 | 3 | — | — | — |
| RFC-0003 | 1 | — | — | — |
| RFC-0003 | 2 | — | — | — |

**Total tokens tracked:** ~109k _(incomplete — fill as phases report)_

---

## RFC-0001 — Passkeys PoC wrap-up — local HTTPS + Android

### Phase 1 — Infrastructure and HTTPS

**What went well**
- Explicit parallelism map (1.1, 1.2, 1.5 in parallel) worked without conflicts
- Completion criterion with a real command (`curl -k`) was objective and verifiable

**What caused friction / rework**
- Environment variables in `.env-example` were outdated (`REDIS_HOST`/`REDIS_PORT` → `REDIS_URL`; `MONGODB_DATABASE` → `DB_NAME` + `COLLECTION_NAME`). The agent had to reconcile at runtime
- `RP_ORIGIN` in `.env-example` pointed to `http://localhost:3001` (no HTTPS, wrong port). Phase spec should have required consistency with `setup/index.ts`
- `mkcert -install` needs interactive sudo — not automatable; should have been tagged **[manual action]** on the subtask

**Updates applied to the harness**
| File | Change |
|------|--------|
| `CLAUDE.md` | `.env-example` updated to real variable names |
| `CLAUDE.md` | Note on `mkcert -install` as manual step with password |

**Applied?** `[x]` Yes — phase 4 documentation

---

### Phase 1b — Server unit tests

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

### Phase 2 — Android app

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

### Phase 3 — Integration and E2E

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

### Phase 4 — Documentation

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

---

## RFC-0002 — Android passkeys PoC UX

### Phase 1 — Android app UX

**What went well**
- Phase spec referenced RFC-0001 fixes directly (home on `app/home.tsx`)
- Split between visual (1.1), keyboard (1.2), feedback (1.3), and home (1.4) was clear

**What caused friction / rework**
- `npm run lint` failed resolving the `eslint` binary; `passkeys-app/package.json` was updated to `node ./node_modules/eslint/bin/eslint.js` (recorded in phase 1 Notes)

**Suggested harness updates**
| File | Change |
|------|--------|
| `CLAUDE.md` / `passkeys-app/README.md` | Mention the app lint script (done in phase 3) |

**Applied?** `[x]` Yes — phase 3 documentation

---

### Phase 2 — UX validation and E2E

**What went well**
- Automation criterion (`npm test && npm run lint`) was objective; HTTP 404 test aligned with `api.ts`
- Notes split code evidence (keyboard, `accessibilityLabelledBy`, error maps) from manual checklist

**What caused friction / rework**
- Subtasks 2.2–2.3 need an emulator; the harness already allows manual validation — no template change required

**Suggested harness updates**
- None high-priority from this phase

**Applied?** `[x]` N/A

---

### Phase 3 — Documentation

**What went well**
- RFC-0002 in `rfcs/completed/` with Decision Record; `token-report.md` consolidates metrics across all three phases
- `CLAUDE.md` now describes `index.tsx` / `home.tsx` and links RFC-0002 tasks; app README orients the demo without duplicating the RFC

**What caused friction / rework**
- Phase 3 file still listed phase 2 as blocked; manual reconciliation of on-disk task state before running

**Suggested harness updates**
| File | Change |
|------|--------|
| None critical | Orchestrator should confirm phase 2 on disk is `[x]` before treating phase 3 as blocked |

**Applied?** `[x]` Yes — AGENTS.md §2: on-disk check before declaring blocked

---

## RFC-0003 — Visual Identity — app icon, splash, Light Clean theme

### Phase 1 — Asset generation and replacement

**What went well**
- One canvas script (`passkeys-app/scripts/generate-rfc-0003-assets.cjs`) reproduces the RFC’s ring geometry and all four target sizes, including 22% rounded clip for `icon.png`

**What caused friction / rework**
- No `tasks/rfc-0003/` on disk; phase file and README section were created during this execution. RFC text still references `phase-1-assets.md` while the repo uses `fase-1-assets.md`

**Suggested harness updates**
| File | Change |
|------|--------|
| `AGENTS.md` | Add RFC-0003 execute rows in Documentation phase (forbidden to edit `AGENTS.md` during phase execution) |
| `rfcs/proposed/RFC-0003-*.md` | Point Implementation Plan task paths to `fase-*` filenames |

**Applied?** `[ ]` Not yet — pending Documentation phase of RFC-0003

### Phase 2 — `app.json` configuration

**What went well**
- Three color touchpoints are easy to verify with a one-liner `node -e` against `app.json`
- No TypeScript or native changes; RFC non-goal preserved

**What caused friction / rework**
- Task file `fase-2-appjson.md` was missing; RFC still says `phase-2-appjson.md`
- Values were already correct in the tree; execution was verify-and-document, not edit

**Suggested harness updates**
| File | Change |
|------|--------|
| `rfcs/proposed/RFC-0003-*.md` | Same as phase 1: align Implementation Plan filenames to `fase-2-appjson.md` |

**Applied?** `[ ]` Not yet — pending Documentation phase of RFC-0003

---

## Cross-cutting insights (all RFCs)

| Category | Insight | Priority |
|----------|---------|----------|
| **Spec** | Always cross-check env var names with `setup/index.ts` before writing the phase | High |
| **Spec** | Verify paths for tooling outputs (keystores, certs) by running them before fixing in the spec | High |
| **Tests** | HTTP service tests should assert request body/headers, not only mocked responses | Medium |
| **Infra** | Subtasks needing hardware or manual interaction → tag **[manual action]** + do not block the parallelism map | Medium |
| **Tooling** | Pin CLI flag versions in the spec (e.g. `--testPathPatterns` in Jest v29) | Low |
| **Architecture** | Define app route structure (which file is authenticated home) in the RFC, not only in a phase | High |
| **Blockers** | Phase with 3+ resolved blockers = prior phase spec had gaps; review template to require stricter preconditions | High |
