# Phase 3 — Documentation & RFC-0004 close-out (RFC-0004)

**Phase status**: `[x] completed`  
**Owning agent**: Claude Sonnet 4.6 (Claude Code)  
**Started at**: `2026-04-26T11:10:00Z`  
**Completed at**: `2026-04-26T11:25:00Z`

---

## Prerequisite

`tasks/rfc-0004/fase-2-android-keystore.md` is `[x] completed`.

---

## Completion criterion

- `rfcs/completed/RFC-0004-*.md` exists (moved from `rfcs/draft/`), YAML `status: COMPLETED` (or DRAFT→COMPLETED per team), **`## Decision Record`** filled.
- `CLAUDE.md` includes **RFC-0004** pointer: how to test binding PoC (server env, MongoDB collection names, manual emulator steps).
- `AGENTS.md` §0 already lists RFC-0004 phases 1–3 (harness); this phase confirms `tasks/README.md` and adds root **`README.md`** link if the RFC is the entry for contributors (per `_template-fase.md` doc rule: include root `README.md` when it exists for clone orientation).
- A new developer can run the **manual PoC** using only `CLAUDE.md` + this RFC’s Decision Record (no hidden scripts).

---

## Subtasks

### 3.1 — RFC: draft → `rfcs/completed/`
- **Status**: `[x] completed`
- **depends_on**: []
- **Files**: `rfcs/draft/RFC-0004-android-keystore-auth-audit-biometry-signal.md` → `rfcs/completed/`
- **What to do**: Move file; set `status`, `decision_date`, `last_updated`; complete **`## Decision Record`** (Accept hypothesis / partial / follow-up); add **## Harness** subsection with `tasks/rfc-0004/fase-*.md` links if not present.
- **Verification**: File path correct; no broken in-repo links.

### 3.2 — `CLAUDE.md` + `README` (root and/or `passkeys-app/README.md`, `passkeys-server/README.md` as affected)
- **Status**: `[x] completed`
- **depends_on**: [3.1]
- **What to do**: Document `AUTH_DENY_ON_BINDING_LOST`, collections `auth_attempts` / `keystore_binding` (incl. **`schemaVersion`** if present), and Android binding PoC steps. Include a **short “PoC limitations”** blurb: `binding_lost` ≠ prova de atacante; desbloqueio pode ser **PIN**; emulador ≠ hardware; volume em `auth_attempts` pode ser ruído. Point to RFC **`## PoC limitations`**, **`## Open questions`**, and (optional) brainstorming notes `_bmad-output/brainstorming/brainstorming-session-2026-04-25-1200.md`. Add **one paragraph** on **retention / minimização** de dados for research (Open Q7) even for local MongoDB. Avoid duplicating the full RFC—summarize and link to `rfcs/completed/...`.
- **Verification**: Links resolve; limitations + retention mentioned.

### 3.3 — `tasks/README.md` and `tasks/feedback-forward.md`
- **Status**: `[x] completed`
- **depends_on**: [3.1]
- **What to do**: Ensure RFC-0004 table (already in harness) is accurate; mark **Feedback Forward** “Applied?” rows from phases 1–2 where this phase applied harness/doc updates; add **Token summary** row for phase 3.
- **Verification**: `tasks/feedback-forward.md` Token summary recalculated.

### 3.4 — Mark phase files `Applied?` in 3.1–3.2 suggestions
- **Status**: `[x] completed`
- **depends_on**: [3.2, 3.3]
- **What to do**: Update `tasks/rfc-0004/fase-1-*.md` and `fase-2-*.md` **Applied?** where documentation implemented their suggested harness items.
- **Verification**: Grep for `Applied?` in `tasks/rfc-0004/`.

---

## Parallelism map

```
3.1 first → 3.2, 3.3 in parallel if desired → 3.4
```

---

## Orchestrator instructions

> Read when you run `/feature-dev execute RFC-0004 phase 3`

**Precondition:** Confirm `tasks/rfc-0004/fase-2-android-keystore.md` is `[x] completed` on disk.

**On start:** Set **Phase status** to `[~] in_progress`, **Started at** (ISO).

1. Run subtasks 3.1–3.4.
2. **Before** `[x] completed`, ask the user: *"Phase complete. How many tokens were consumed and what % of the context window was used?"*  
   Record in **Token usage**, `tasks/feedback-forward.md`, and add post-mortem if context usage was above 75% (per `AGENTS.md` §2).

### Wrap-up
- If this is the **last** phase of RFC-0004, display:  
  **All phases of RFC-0004 are complete. Before closing, review `tasks/feedback-forward.md` for `Applied? [ ]` items.**

---

## Blockers

_No blockers recorded._

---

## Notes

_

---

## Feedback Forward

### What went well
- 

### What caused friction / rework
- 

### Suggested harness updates

| File | Section | Suggested change |
|------|---------|------------------|
| | | |

### Applied?
`[ ]` N/A (this is the documentation phase) — mark rows from earlier phases as `[x]` when done.

---

## Token usage

| Field | Value |
|-------|-------|
| Tool | — |
| Tokens consumed | — |
| Context window % | — |
| Notes | — |
