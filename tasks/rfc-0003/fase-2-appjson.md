# Phase 2 — `app.json` configuration (Light Clean)

**Phase status**: `[x] completed`  
**Owning agent**: Cursor agent  
**Started at**: `2026-04-25T18:00:00Z`  
**Completed at**: `2026-04-25T18:05:00Z`

---

## Prerequisite

`tasks/rfc-0003/fase-1-assets.md` is `[x] completed`.

---

## Completion criterion

```bash
node -e "const j=require('./passkeys-app/app.json'); const e=j.expo; \
  if(e.backgroundColor!=='#F8FAFC') process.exit(1); \
  const p=e.plugins.find(x=>Array.isArray(x)&&x[0]==='expo-splash-screen'); \
  if(!p||p[1].backgroundColor!=='#F8FAFC') process.exit(2); \
  if(e.android.adaptiveIcon.backgroundColor!=='#F8FAFC') process.exit(3); \
  console.log('OK');"
# Expect: OK
```

Run from repository root. The phase is complete when the command exits 0 and prints `OK`.

**Committed `android/` tree:** If `passkeys-app/android/` is in the repo, after changing splash or adaptive settings you must also run `npx expo prebuild --platform android` (or a full `npx expo run:android` that runs prebuild) and confirm `passkeys-app/android/app/src/main/res/values/colors.xml` has `splashscreen_background` and `iconBackground` as `#F8FAFC`. Editing `app.json` alone can leave native resources stale.

---

## Subtasks

### 2.1 — Root `expo.backgroundColor`
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/app.json`
- **What to do**: Set `"backgroundColor": "#F8FAFC"` on `expo` (app-wide / web shell).
- **Verification**: Key present and value `#F8FAFC`.

### 2.2 — `expo-splash-screen` plugin `backgroundColor`
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/app.json`
- **What to do**: In the `expo-splash-screen` plugin config, set `"backgroundColor": "#F8FAFC"`.
- **Verification**: Plugin second element has `backgroundColor` `#F8FAFC`.

### 2.3 — Android adaptive icon `backgroundColor`
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/app.json`
- **What to do**: `android.adaptiveIcon.backgroundColor` = `#F8FAFC`.
- **Verification**: Key present and value `#F8FAFC`.

---

## Parallelism map

```
2.1, 2.2, 2.3 — same file; edit once (atomic)
```

---

## Orchestrator instructions

> Read when you run `/feature-dev execute RFC-0003 phase 2`

**Precondition:** `tasks/rfc-0003/fase-1-assets.md` is `[x] completed`.

**On start:** Update header to `[~] in_progress` with **Started at**.

1. Open `passkeys-app/app.json` and ensure the three color fields per `rfcs/completed/RFC-0003-visual-identity.md` (Technical Design → `app.json` changes).
2. Run the **Completion criterion** command from repo root; exit must be 0.
3. Mark 2.1–2.3 complete.
4. **Wrap-up:** Phase status `[x] completed` with **Completed at**; fill **Feedback Forward**; append to `tasks/feedback-forward.md` under RFC-0003.

---

## Blockers

_No blockers recorded._

---

## Notes

On execution, `app.json` already contained all three fields aligned with RFC-0003 (likely applied together with icon work or an earlier edit). No file diff was required; verification script confirmed values.

---

## Feedback Forward

### What went well
- RFC’s JSONC snippet maps 1:1 to three subtasks; one edit pass is enough
- Programmatic check (Node `require` of `app.json`) is faster than manual eyeballing

### What caused friction / rework
- Phase task file was missing on disk (RFC names `phase-2-appjson.md`; repo convention is `fase-2-appjson.md`) — created during this run
- `tasks/README.md` listed phase 2 as TBD; updated when closing this phase

### Suggested harness updates

| File | Section | Suggested change |
|------|---------|------------------|
| `rfcs/proposed/RFC-0003-visual-identity.md` | Implementation Plan | Rename task file refs to `fase-2-appjson.md` / `fase-3-*.md` |
| `AGENTS.md` | §0 command table | Add row for `/feature-dev execute RFC-0003 phase 2` → `tasks/rfc-0003/fase-2-appjson.md` (Documentation phase) |

### Applied?
`[x]` Yes — RFC-0003 phase 4 (AGENTS.md §0; RFC moved to `rfcs/completed/`)

---

## Token usage

| Field | Value |
|-------|-------|
| Tool | Cursor |
| Tokens consumed | ~51.5k |
| Context window | ~25.8% used |
| Notes | Valores informados pelo utilizador após a execução da fase |
