# Task tracking

Each **RFC** has a folder `tasks/rfc-<number>/` with status files for that initiative. Phase numbers (1, 2, 3, …) **restart for each RFC**.

Shared templates (under `tasks/`):

- `tasks/_template-fase.md` — base for new phases

## RFC-0001 — `tasks/rfc-0001/`

| File | Phase | Description |
|------|-------|-------------|
| `fase-1-status.md` | 1 | Server infrastructure and HTTPS |
| `fase-1b-testes-server.md` | 1b | Server unit tests (Jest + ts-jest) |
| `fase-2-status.md` | 2 | Android app (prebuild, passkeys, screens, api.ts tests) |
| `fase-3-status.md` | 3 | Integration, emulator certificates, E2E tests |
| `fase-4-documentacao.md` | 4 | Consolidated documentation (CLAUDE.md, READMEs, RFC → completed) |
| `token-report.md` | — | Token consolidation (RFC-0001) |

## RFC-0002 — `tasks/rfc-0002/`

| File | Phase | Description |
|------|-------|-------------|
| `fase-1-ux-app.md` | 1 | Android app UX |
| `fase-2-ux-validacao.md` | 2 | UX and E2E validation |
| `fase-3-documentacao.md` | 3 | Documentation (RFC-0002 → completed) |
| `token-report.md` | — | Token consolidation (RFC-0002), created in phase 3 |

## RFC-0003 — `tasks/rfc-0003/`

| File | Phase | Description |
|------|-------|-------------|
| `fase-1-assets.md` | 1 | Branded app icon, adaptive icon, splash icon, favicon (PNG replacement) |
| `fase-2-appjson.md` | 2 | `app.json` — `expo.backgroundColor`, splash plugin, Android adaptive background (`#F8FAFC`) |
| `fase-3-validacao.md` | 3 | Device/emulator: `expo run:android`, launcher/splash checks, `expo prebuild` sync to `android/` |
| `fase-4-documentacao.md` | 4 | RFC → `rfcs/completed/`, Decision Record, `AGENTS`/`README` / `CLAUDE` pointers, `feedback-forward` applied markers |

> Command rows for RFC-0003 phases 1–4 are in `AGENTS.md` §0.

## Status legend

```
[ ] pending      — not started
[~] in_progress  — in progress
[x] completed    — done and verified
[!] blocked      — blocked (see Blockers in the file)
[-] skipped      — skipped with justification
```

## Quick reference

- Create harness for a new RFC: `AGENTS.md` section 0
- `../rfcs/_template-rfc.md` — base for new RFCs
- `../AGENTS.md` — `/feature-dev` commands and agent rules
- `tasks/feedback-forward.md` — cross-RFC log of insights from each completed phase

To scaffold a full new RFC: `/feature-dev create harness for RFC-XXXX`

## Conventions

- Each agent updates the status file when **starting** and when **completing** each subtask
- Phases are sequential **within** an RFC; across RFCs, follow each phase’s cadence and prerequisites
- Within a phase, subtasks with no dependency may run in parallel
- See `AGENTS.md` section 0 for the full process
