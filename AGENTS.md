# AGENTS.md

Conventions for agents (Claude Code, Cursor, or any LLM) working in this repository.
These rules take precedence over default agent behavior.

---

## 0. How to use this harness

### Run an existing phase

Open a new context window and run:

```
/feature-dev execute RFC-XXXX phase <identifier>
```

- `RFC-XXXX` is the initiative (e.g. `RFC-0001`, `RFC-0002`)
- Task folder is `tasks/rfc-xxxx/` (RFC number in **lowercase**)
- `phase` uses the plan identifier: `1`, `1b`, `2`, `3`, … (each RFC restarts at 1)

The agent opens the matching `tasks/rfc-xxxx/fase-....md` file, reads the **"Orchestrator instructions"** section, and executes. Each file is self-contained.

| Command | File read |
|---------|-----------|
| `/feature-dev execute RFC-0001 phase 1` | `tasks/rfc-0001/fase-1-status.md` |
| `/feature-dev execute RFC-0001 phase 1b` | `tasks/rfc-0001/fase-1b-testes-server.md` |
| `/feature-dev execute RFC-0001 phase 2` | `tasks/rfc-0001/fase-2-status.md` |
| `/feature-dev execute RFC-0001 phase 3` | `tasks/rfc-0001/fase-3-status.md` |
| `/feature-dev execute RFC-0001 phase 4` | `tasks/rfc-0001/fase-4-documentacao.md` |
| `/feature-dev execute RFC-0002 phase 1` | `tasks/rfc-0002/fase-1-ux-app.md` |
| `/feature-dev execute RFC-0002 phase 2` | `tasks/rfc-0002/fase-2-ux-validacao.md` |
| `/feature-dev execute RFC-0002 phase 3` | `tasks/rfc-0002/fase-3-documentacao.md` |

> **Note:** On-disk filenames keep the `fase-` prefix; the slash command uses the English keyword `phase`.

---

### Create a harness for a new RFC

**Do not recreate the shared infrastructure.** `AGENTS.md`, `CLAUDE.md`, and `tasks/README.md` are permanent and shared across all RFCs.

For a new RFC, use:

```
/feature-dev create harness for RFC-{{NUMBER}}
```

The agent must:

1. **Create the RFC** at `rfcs/draft/RFC-{{NUMBER}}-{{slug}}.md`
   - Use `rfcs/_template-rfc.md` as the base
   - Fill all sections with the initiative content

2. **Create the folder** `tasks/rfc-<NUMBER-IN-LOWERCASE>/` (e.g. `tasks/rfc-0003/`)

3. **Create the phase files** in that folder
   - One file per phase defined in the RFC
   - Use `tasks/_template-fase.md` as the base for each
   - Naming: `fase-<number>-<slug>.md` (numeric phases restart at **1** for each RFC)
   - Fill subtasks, parallelism map, and orchestrator instructions
   - Cross-references and preconditions use paths `tasks/rfc-XXXX/...`

4. **Update `tasks/README.md`**
   - Add a section with a table for the new RFC and file paths

5. **Update the command table** in section 0 of this file (`AGENTS.md`)
   - Add rows `/feature-dev execute RFC-XXXX phase Y → tasks/rfc-xxxx/fase-....md`

**Do not when creating a harness:**
- Do not modify other RFCs’ phases without coordination
- Do not change `CLAUDE.md` (except in the documentation phase, if the RFC says so)
- Do not move or rename completed `tasks/rfc-xxxx/` folders without updating **all** references (AGENTS, README, phases, RFCs)

---

## 1. Required reading before any task

Before writing any code, read:

1. `CLAUDE.md` — project overview, commands, architecture
2. The status file for the phase you are working on (`tasks/rfc-XXXX/...md`)
3. The plan RFC in `rfcs/draft/` or `rfcs/completed/` (per the active initiative)

---

## 2. Status update rules

Every agent **must** update their phase status file before starting and after completing each subtask.

### Status format

```
[ ] pending      — not started
[~] in_progress  — in progress (include ISO timestamp and which agent)
[x] completed    — done and verified
[!] blocked      — blocked (describe why on the line below)
[-] skipped      — skipped with justification
```

### Blocking rule

If a subtask is blocked:
1. Mark `[!] blocked` with a reason
2. Do **not** advance to dependent subtasks
3. Do **not** silently work around the block
4. Record the dependency in the `## Blockers` section of the status file

### Phase completion rule

A phase is complete only when **all completion criteria** listed in the status file are verified. Do not mark the phase complete before that.

Before setting **Phase status** to `[x] completed`, the agent **must** ask the user:

> "Phase complete. How many tokens were consumed and what % of the context window was used?"

Record the reported values in the `## Token usage` table of the phase file. This is required — do not skip it even if the user does not reply immediately.

### On-disk precondition check

Before declaring a phase blocked on a precondition, **read the previous phase file on disk** and confirm the real status. It may already be `[x] completed` even if the orchestrator did not get explicit confirmation (lesson: RFC-0002 phase 3).

---

## 3. Project architecture — server rules

Directory: `passkeys-server/src/`

### Layers (keep separation)

```
infra/api/index.ts        ← Fastify routes and middleware only
registration/index.ts     ← WebAuthn registration logic only
authentication/index.ts   ← WebAuthn authentication logic only
infra/database/           ← data access only (MongoDB, Redis)
setup/index.ts            ← environment variables only
```

**Forbidden:** import `database.ts` directly from `api/index.ts`. Routes call only `registration/` or `authentication/` modules.

**Forbidden:** put business logic in `infra/api/index.ts`. Routes are thin controllers.

### TypeScript

- `strict: true` is on — do not use `any` without an explicit comment justification
- Do not use `console.log` — use `logger` from `infra/logger.ts`
- Environment variables: always read from `setup/index.ts`, never from `process.env` directly in modules

---

## 4. Project architecture — app rules

Directory: `passkeys-app/`

### Expected end state

```
app/
├── index.tsx             ← login/register screen (public entry — Calm Card)
├── home.tsx              ← authenticated screen (Home Proof); do NOT use app/(tabs)/index.tsx
├── (tabs)/
│   └── index.tsx         ← generic tabs (explore etc.); outside passkey flow
└── _layout.tsx           ← root layout (change only if needed)

services/
└── api.ts                ← only file for HTTP calls to the server

```

**Forbidden:** call `fetch` directly from screen components. All HTTP goes through `services/api.ts`.

**Forbidden:** import `react-native-passkey` outside `app/index.tsx`. Passkey logic stays on the entry screen.

**Forbidden:** use `app/(tabs)/index.tsx` as the post-login navigation target. The passkey flow uses `app/index.tsx` → `app/home.tsx`. Mixing with tab navigation causes route ambiguity and logout blockers (lesson: RFC-0001 phase 3).

### Expo

- This project uses `expo-dev-client` — do not use Expo Go for native modules
- Before `expo prebuild`, confirm `sdkVersion` in `app.json` matches the installed Expo SDK (e.g. `"53.0.0"` for SDK 53). Mismatch causes Gradle failure.
- After any native dependency: `npx expo prebuild --platform android --clean`
- The `@/` path alias is configured — prefer it over relative paths

---

## 5. Parallelism between agents

Within a phase, some subtasks are independent and can run in parallel. Each phase’s status file shows which subtasks depend on others.

**General rule:**
- Subtasks with `depends_on: []` may run in parallel
- Subtasks with `depends_on: [X.Y]` start only after X.Y is `[x] completed`
- The orchestrator agent reads status before launching sub-agents

---

## 6. Testing rules

- Verify the phase completion criterion **with a real command** before marking complete
- Completion criteria are defined in each `tasks/rfc-XXXX/fase-....md` for the active RFC
- If the completion criterion fails, mark the relevant subtask `[!] blocked`

### Jest — flags and version

- Jest v29+ renamed `--testPathPattern` (singular) to `--testPathPatterns` (plural). Always use the plural form when fixing commands in a phase spec.
- Check installed version: `npx jest --version`

### HTTP service tests (`services/api.ts`)

- Tests for functions that use `fetch` must validate **what is sent** (body, headers) — not only mock the response. Mocking the response only hides empty-body or missing-header bugs until integration (lesson: RFC-0001 phase 3).
- Use `expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ body: ... }))` or equivalent.

---

## 7. What not to do

- Do not refactor code outside the current task
- Do not add dependencies not specified in the RFC or status file
- Do not modify `CLAUDE.md` or `AGENTS.md` while executing a phase
- Do not delete files without recording the reason in the status file
- Do not advance a phase without the previous phase’s completion criterion verified

---

## 8. Feedback Forward — continuous harness improvement

### What it is

When each phase ends, the orchestrator agent **must** capture what was learned and record it in two places:

1. The `## Feedback Forward` section of the completed phase file
2. `tasks/feedback-forward.md` (cross-RFC log)

These feed each RFC’s Documentation phase, which applies improvements to permanent harness files (`AGENTS.md`, `CLAUDE.md`, `_template-fase.md`).

### When to fill

Immediately before updating **Phase status** to `[x] completed`. Not optional.

### What to capture

| Category | Examples |
|-----------|---------|
| **Wrong spec** | Wrong file path, outdated variable name, CLI flag that changed between versions |
| **Precondition gap** | Unmarked hardware dependency, undocumented environment prerequisite |
| **Test gap** | Behavior not covered by unit tests that showed up in integration |
| **Architecture decision** | Route structure, logic placement, separation not in the spec |
| **Avoidable rework** | Anything that, if in the spec, would have saved time |

### Alert signal

A phase with **3 or more resolved blockers** suggests earlier phase specs had major gaps. Then the agent should:
1. Fill `## Feedback Forward` focused on the previous spec’s gaps
2. Add an entry under “Cross-cutting insights” in `tasks/feedback-forward.md` if the pattern recurs
3. Suggest an explicit `_template-fase.md` update to avoid the same gap in future RFCs

### Application process (documentation phase)

The Documentation phase agent for each RFC must:
1. Read `tasks/feedback-forward.md` in full
2. Apply all lines with `Applied? [ ]` that are high priority
3. Mark applied lines `[x]` with commit or PR reference
4. Update `tasks/README.md` if new harness files are created

---
