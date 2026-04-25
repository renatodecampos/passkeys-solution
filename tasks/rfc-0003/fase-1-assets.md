# Phase 1 — Asset generation and replacement

**Phase status**: `[x] completed`  
**Owning agent**: Cursor agent  
**Started at**: `2026-04-25T12:00:00Z`  
**Completed at**: `2026-04-25T12:30:00Z`

---

## Prerequisite

_(First phase — none.)_

---

## Completion criterion

```bash
cd passkeys-app && sips -g pixelWidth -g pixelHeight \
  assets/images/icon.png assets/images/adaptive-icon.png \
  assets/images/splash-icon.png assets/images/favicon.png
# Expect: 1024×1024, 1024×1024, 200×200, 32×32
```

Expected: `icon.png` and `adaptive-icon.png` are 1024×1024; `splash-icon.png` is 200×200; `favicon.png` is 32×32. All show RFC-0003 Light Clean fingerprint design (no Expo placeholder).

The phase is complete when the four PNGs exist at the correct dimensions and `tasks/rfc-0003/fase-1-assets.md` subtasks are `[x] completed`.

---

## Subtasks

### 1.1 — icon.png (1024×1024)
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/assets/images/icon.png`
- **What to do**: Replace with Light Clean fingerprint export; 22% corner radius clip (iOS-safe), background `#F8FAFC`.
- **Verification**: 1024×1024 PNG.

### 1.2 — adaptive-icon.png (1024×1024)
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/assets/images/adaptive-icon.png`
- **What to do**: Replace with full-bleed square (no rounded mask in asset).
- **Verification**: 1024×1024 PNG.

### 1.3 — splash-icon.png (200×200)
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/assets/images/splash-icon.png`
- **What to do**: Center icon at RFC scale for splash.
- **Verification**: 200×200 PNG.

### 1.4 — favicon.png (32×32)
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/assets/images/favicon.png`
- **What to do**: Export at 32×32; stroke scales for legibility.
- **Verification**: 32×32 PNG.

---

## Parallelism map

```
1.1, 1.2, 1.3, 1.4 — generated in one batch from the same script (atomic replacement)
```

---

## Orchestrator instructions

> Read when you run `/feature-dev execute RFC-0003 phase 1`

**Precondition:** N/A (phase 1).

**On start:** Header updated with in_progress.

1. Generate PNGs per `rfcs/completed/RFC-0003-visual-identity.md` (Technical Design → Icon specification).
2. Use `passkeys-app/scripts/generate-rfc-0003-assets.cjs` (or regenerate per RFC) and write only the four files above.
3. Mark 1.1–1.4 complete after dimension check.
4. **Wrap-up:** Phase status `[x] completed` with **Completed at**; fill **Feedback Forward**; append to `tasks/feedback-forward.md`.

---

## Blockers

_No blockers recorded._

---

## Notes

_Harness folder created during first execution; add row to `AGENTS.md` command table in RFC-0003 Documentation phase if missing._

---

## Feedback Forward

### What went well
- RFC Technical Design (ring radii, gap sweep, color tokens) maps directly to a small canvas script; regeneration is one command
- `sips` on macOS is enough to verify dimensions without ImageMagick

### What caused friction / rework
- `tasks/rfc-0003/` and `fase-1-assets.md` did not exist; created during this run (full harness for RFC-0003 was never scaffolded; RFC references `phase-1-assets.md` but repo convention is `fase-1-assets.md`)
- `AGENTS.md` command table not updated in this run (per AGENTS: do not edit `AGENTS.md` while executing a phase)

### Suggested harness updates

| File | Section | Suggested change |
|------|---------|------------------|
| `AGENTS.md` | §0 command table | Add row: `/feature-dev execute RFC-0003 phase 1` → `tasks/rfc-0003/fase-1-assets.md` (and future phases) |
| `rfcs/proposed/RFC-0003-visual-identity.md` | Implementation Plan | Align task file names to `fase-*` convention |

### Applied?
`[x]` Yes — RFC-0003 phase 4 (AGENTS.md §0; RFC in `rfcs/completed/`)

---

## Token usage

| Field | Value |
|-------|-------|
| Tool | Cursor |
| Tokens consumed | ~60k |
| Context window | ~30% usado (referência de sessão) |
| Notes | Valores informados pelo usuário após a execução da fase |
