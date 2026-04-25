# Feedback Forward — RFC-0003

> Phase retrospectives for RFC-0003 — Visual Identity — app icon, splash, Light Clean theme.
> Cross-RFC summary lives in `tasks/feedback-forward.md`.

---

## Phase 1 — Asset generation and replacement

**What went well**
- One canvas script (`passkeys-app/scripts/generate-rfc-0003-assets.cjs`) reproduces the RFC's ring geometry and all four target sizes, including 22% rounded clip for `icon.png`
- `sips` on macOS is enough to verify dimensions without ImageMagick

**What caused friction / rework**
- No `tasks/rfc-0003/` on disk; phase file and README section were created during this execution. RFC text still references `phase-1-assets.md` while the repo uses `fase-1-assets.md`
- `AGENTS.md` command table not updated in this run (per AGENTS: do not edit `AGENTS.md` while executing a phase)

**Suggested harness updates**
| File | Section | Suggested change |
|------|---------|------------------|
| `AGENTS.md` | §0 command table | Add row: `/feature-dev execute RFC-0003 phase 1` → `tasks/rfc-0003/fase-1-assets.md` (and future phases) |
| `rfcs/proposed/RFC-0003-visual-identity.md` | Implementation Plan | Align task file names to `fase-*` convention |

**Applied?** `[x]` Yes — RFC-0003 phase 4 (AGENTS.md §0; RFC in `rfcs/completed/`)

---

## Phase 2 — `app.json` configuration

**What went well**
- RFC's JSONC snippet maps 1:1 to three subtasks; one edit pass is enough
- Programmatic check (Node `require` of `app.json`) is faster than manual eyeballing

**What caused friction / rework**
- Phase task file was missing on disk (RFC names `phase-2-appjson.md`; repo convention is `fase-2-appjson.md`) — created during this run
- `tasks/README.md` listed phase 2 as TBD; updated when closing this phase

**Suggested harness updates**
| File | Section | Suggested change |
|------|---------|------------------|
| `rfcs/proposed/RFC-0003-visual-identity.md` | Implementation Plan | Rename task file refs to `fase-2-appjson.md` / `fase-3-*.md` |
| `AGENTS.md` | §0 command table | Add row for `/feature-dev execute RFC-0003 phase 2` → `tasks/rfc-0003/fase-2-appjson.md` (Documentation phase) |

**Applied?** `[x]` Yes — RFC-0003 phase 4 (AGENTS.md §0; RFC moved to `rfcs/completed/`)

---

## Phase 3 — Device validation

**What went well**
- `aapt dump badging` and `android/.../colors.xml` give objective checks beyond screenshots
- `expo export` is a fast way to prove Metro can resolve the graph without a device

**What caused friction / rework**
- **Stale native folder:** `app.json` had correct `#F8FAFC` after phase 2, but `android/.../colors.xml` was still **#ffffff** until `expo prebuild` — changing `app.json` alone does not update committed `android/`; phase 2 completion should mention **prebuild** (or `expo run:android` with sync) for splash/adaptive
- **Deleted template assets** (`SpaceMono`, `react-logo*.png`) broke bundling; fixed by removing font load and swapping explore image
- `tasks/README.md` listed phase 3 as TBD; no `fase-3-*.md` on disk — created `fase-3-validacao.md` for this run

**Suggested harness updates**
| File | Section | Suggested change |
|------|---------|------------------|
| `tasks/rfc-0003/fase-2-appjson.md` | Completion criterion | Add: run `npx expo prebuild --platform android` and assert `grep splashscreen_background android/app/src/main/res/values/colors.xml` is `#F8FAFC` |
| `rfcs/proposed/RFC-0003-visual-identity.md` | Phase 3 | Rename task file ref to `fase-3-validacao.md` |
| `AGENTS.md` | §0 | Add row `/feature-dev execute RFC-0003 phase 3` → `tasks/rfc-0003/fase-3-validacao.md` in Documentation phase |

**Applied?** `[x]` Yes — `fase-2-appjson.md` completion criterion extended; RFC-0003 phase 4 (AGENTS.md §0; RFC in `rfcs/completed/`)

---

## Phase 4 — Documentation

**What went well**
- Short scope: one RFC file move, Decision Record, harness table rows, app README blurb, `feedback-forward` Applied markers
- No code churn; aligns with "documentation phase applies pending harness lines" in `AGENTS.md`
- Prior phases had already listed concrete harness edits; this phase only applies them

**What caused friction / rework**
- `fase-4-documentacao.md` did not exist until this execution (RFC defined phase 4 only inside the RFC body)

**Suggested harness updates**
| File | Change |
|------|--------|
| None required | For new RFCs, scaffold `fase-4-documentacao.md` when creating the folder if the RFC lists a documentation phase |

**Applied?** `[ ]` Optional — only if the next RFC harness adds an empty `fase-4` stub
