# Feedback Forward — RFC-0002

> Phase retrospectives for RFC-0002 — Android passkeys PoC UX.
> Cross-RFC summary lives in `tasks/feedback-forward.md`.

---

## Phase 1 — Android app UX

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

## Phase 2 — UX validation and E2E

**What went well**
- Automation criterion (`npm test && npm run lint`) was objective; HTTP 404 test aligned with `api.ts`
- Notes split code evidence (keyboard, `accessibilityLabelledBy`, error maps) from manual checklist

**What caused friction / rework**
- Subtasks 2.2–2.3 need an emulator; the harness already allows manual validation — no template change required

**Suggested harness updates**
- None high-priority from this phase

**Applied?** `[x]` N/A

---

## Phase 3 — Documentation

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
