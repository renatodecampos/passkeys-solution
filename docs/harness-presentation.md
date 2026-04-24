# Harness Engineering with AI Agents

*How we structured development so agents work together, in parallel, without losing track*

---

## Navigation

| Slides 1–6 | Slides 7–11 | Slides 12–15 | Slides 16–19 |
|---|---|---|---|
| [1 Cover](#slide-1--cover) | [7 RFC](#slide-7--component-1-rfc) | [12 Phases](#slide-12--execution-phases) | [16 How to Replicate](#slide-16--how-to-replicate) |
| [2 The Problem](#slide-2--the-problem) | [8 AGENTS.md](#slide-8--component-2-agentsmd) | [13 Parallelism](#slide-13--execution-parallelism) | [17 Lessons Learned](#slide-17--lessons-learned) |
| [3 The Thesis](#slide-3--the-thesis) | [9 CLAUDE.md](#slide-9--component-3-claudemd) | [14 Handoff](#slide-14--execution-handoff) | [18 Stack Summary](#slide-18--stack-summary) |
| [4 The Project](#slide-4--the-project) | [10 Task Files](#slide-10--component-4-task-files) | [15 Results](#slide-15--results) | [19 Next Steps](#slide-19--next-steps--qa) |
| [5 BMad](#slide-5--bmad-the-skills-layer) | [11 Templates](#slide-11--component-5-templates) | | |
| [6 Harness Overview](#slide-6--harness-overview) | | | |

**Project files referenced in this presentation:**
[`AGENTS.md`](../AGENTS.md) · [`CLAUDE.md`](../CLAUDE.md) · [`RFC-0001`](../rfcs/completed/RFC-0001-passkeys-poc-completion.md) · [`tasks/`](../tasks/README.md)

---

## Slide 1 — Cover

### Harness Engineering with AI Agents

*How we structured development so agents work together, in parallel, without losing track*

> **Speaker note:** "This is not about using AI. It's about process engineering with AI."

---

## Slide 2 — The Problem

### Have you ever tried to develop with LLMs without structure?

- Context is lost between sessions
- Agent A doesn't know what Agent B did
- Claude Code and Cursor don't share state
- Tokens wasted rebuilding context every session
- No way to know where you stopped or what's broken

---

## Slide 3 — The Thesis

### Agents need infrastructure, not just prompts

| Persistent State | Shared Rules | Controlled Parallelism |
|---|---|---|
| Status files any agent can read | AGENTS.md defines what agents can and can't do | Parallelism map per phase |

---

## Slide 4 — The Project

### The POC: Passwordless Authentication with WebAuthn/Passkeys

| | |
|---|---|
| **passkeys-server** | Fastify + TypeScript + MongoDB + Redis |
| **passkeys-app** | Expo + React Native + Android |
| **Goal** | E2E registration and authentication flow via passkey |
| **Constraint** | Local HTTPS with self-signed certificate — no paid cert |

> **Speaker note:** "The project itself is secondary. What matters is how the harness managed the complexity."

---

## Slide 5 — BMad: The Skills Layer

### BMad: the framework that gave agents specialized workflows

**What is BMad:** an open-source skills framework that extends Claude Code and Cursor behavior via slash commands — each skill loads a structured workflow.

| Skill | Used for |
|---|---|
| `rfc-specification` | Writing the RFC with neutral trade-off evaluation |
| `feature-dev` | Orchestrating parallel sub-agents per phase |
| `bmad-help` | Navigating the workflow and planning next steps |
| `bmad-cis-agent-presentation-master` | This very presentation |

*BMad answered **"how to work"**. The harness answered **"what's the current state"**.*

---

## Slide 6 — Harness Overview

### 5 components, 1 shared language

| Component | File | Role |
|---|---|---|
| `RFC` | [`rfcs/completed/RFC-0001`](../rfcs/completed/RFC-0001-passkeys-poc-completion.md) | Defines the plan |
| `AGENTS.md` | [`AGENTS.md`](../AGENTS.md) | Defines the rules |
| `CLAUDE.md` | [`CLAUDE.md`](../CLAUDE.md) | Orients any new agent |
| `tasks/phase-X.md` | [`tasks/`](../tasks/README.md) | State in real time |
| `_templates` | [`tasks/_template-phase.md`](../tasks/_template-fase.md) | Ensures replicability |

---

## Slide 7 — Component 1: RFC

### RFC: the specification that comes before the code

- Structured format: **problem → options with trade-offs → recommendation → phase plan**
- Lifecycle: `DRAFT` → `REVIEW` → `APPROVED` → `COMPLETED`
- Evaluates options neutrally — no *"obviously the best choice"*
- Template in [`rfcs/_template-rfc.md`](../rfcs/_template-rfc.md) → new RFC in 5 minutes
- At project end: moved to `rfcs/completed/` with Decision Record filled in

**This project's RFC:** [`RFC-0001-passkeys-poc-completion.md`](../rfcs/completed/RFC-0001-passkeys-poc-completion.md)

> **Speaker note:** "The RFC forces you to think before writing code. Agents execute more precisely when the plan is clear."

---

## Slide 8 — Component 2: AGENTS.md

### AGENTS.md: the rules every agent follows — human or LLM

→ [`AGENTS.md`](../AGENTS.md)

- **§0** How to execute a phase → `/feature-dev execute phase X`
- **§0** How to scaffold a new RFC → `/feature-dev create harness for RFC-XXXX`
- **§3** Architecture rules — layers, forbidden imports
- **§5** Parallelism rules — who runs together, who waits
- **§7** What NOT to do — explicit anti-patterns list

*Priority: user instructions > AGENTS.md > agent default behavior*

---

## Slide 9 — Component 3: CLAUDE.md

### CLAUDE.md: onboarding for any agent — or developer

→ [`CLAUDE.md`](../CLAUDE.md)

**What's in it:**
- Setup, build, test, run commands
- Project architecture and conventions
- Harness reference — where task files and RFC live
- Full environment setup from scratch

**What's NOT in it:**
- Generic best practices
- Anything the code already expresses clearly

*Updated automatically by the Phase 4 documentation agent. No one needs to remember to do it.*

---

## Slide 10 — Component 4: Task Files

### Task Files: the shared state between agents and tools

```
Header          status, responsible agent, timestamps
Criterion       verifiable command — not subjective
Subtasks        [ ] pending  [~] in_progress  [x] completed
                [!] blocked  [-] skipped
depends_on      dependency graph between subtasks
Parallelism map who runs together, who waits
Orchestrator    execution instructions EMBEDDED in the file
Token Usage     consumption log per phase
Notes           free-form agent observations
```

*The status file is the only state needed between sessions and between tools.*

**Phase files from this project:**

| Phase | File | Status |
|---|---|---|
| Phase 1 — HTTPS | [`fase-1-status.md`](../tasks/fase-1-status.md) | `[x] completed` |
| Phase 1b — Tests | [`fase-1b-testes-server.md`](../tasks/fase-1b-testes-server.md) | `[x] completed` |
| Phase 2 — Android | [`fase-2-status.md`](../tasks/fase-2-status.md) | `[x] completed` |
| Phase 3 — E2E | [`fase-3-status.md`](../tasks/fase-3-status.md) | `[x] completed` |
| Phase 4 — Docs | [`fase-4-documentacao.md`](../tasks/fase-4-documentacao.md) | `[x] completed` |

---

## Slide 11 — Component 5: Templates

### Templates: the harness replicates itself

```
tasks/_template-phase.md  →  new phase with full structure
rfcs/_template-rfc.md     →  new RFC with all sections
```

**One command creates everything:**

```
/feature-dev create harness for RFC-0002
```

The agent reads the templates, fills them with the new initiative's content, and updates `AGENTS.md` and `tasks/README.md` automatically.

*You don't build the harness from scratch for each product. The harness builds the harness.*

---

## Slide 12 — Execution: Phases

### Sequential phases. Parallelism inside each phase.

```
Phase 1 → Phase 1b → Phase 2 → Phase 3 → Phase 4
  ↑           ↑         ↑         ↑         ↑
HTTPS       Tests    Android    E2E       Docs
```

- **Sequence rule:** Phase N only starts when Phase N-1 criterion is verified
- **Parallelism rule:** Subtasks with `depends_on: []` run simultaneously
- Phases executed across different tools — state lives in files, not in conversation history

**Phase 1 — live execution in Cursor:**

![Phase 1 execution — subtasks completed, criterion verified](<../imgs/fase 1.png>)

**Phase 1b — unit tests:**

![Phase 1b execution — Jest tests passing](<../imgs/fase 1.b>)

---

## Slide 13 — Execution: Parallelism

### How the orchestrator coordinates sub-agents

**Real example — Phase 2, Android App:**

```
BATCH A — parallel
  Sub-agent 1 → install lib → prebuild → network config → manifest
  Sub-agent 2 → api.ts → api.ts tests

BATCH B — after A completes
  login/register screen

BATCH C — after B
  home screen
```

Each sub-agent marks `[~] in_progress` before, `[x] completed` or `[!] blocked` after. The orchestrator reads the file before advancing.

**Phase 2 — BATCH execution in Cursor:**

![Phase 2 execution — BATCH A/B/C with parallel sub-agents](<../imgs/fase 2.png>)

→ [`fase-2-status.md`](../tasks/fase-2-status.md)

---

## Slide 14 — Execution: Handoff

### Claude Code, Cursor, any agent — same state

| Phase | Tool |
|---|---|
| Phase 1 — HTTPS | Cursor Agent (Sonnet 4.6) |
| Phase 1b — Tests | Cursor Agent (Sonnet 4.6) |
| Phase 2 — Android | Cursor Agent (Sonnet 4.6) |
| Phase 3 — E2E | Cursor Agent (Sonnet 4.6) + manual steps |
| Phase 4 — Docs | Any agent with filesystem access |
| Reviews | Claude Code |

*No conversation history dependency. The agent reads the file, understands the state, continues.*

**Phase 3 — E2E completed, blockers resolved inline:**

![Phase 3 execution — E2E tests passing, corrections applied during phase](<../imgs/fase 3.png>)

→ [`fase-3-status.md`](../tasks/fase-3-status.md)

---

## Slide 15 — Results

### What came out of it

| Metric | Result |
|---|---|
| Phases executed | 5 |
| Subtasks delivered | 24 |
| Test coverage — statements / functions / lines | **100%** |
| Branch coverage | 84% (threshold: 80%) |
| Blockers registered | **0** |
| CLAUDE.md | Auto-updated by Phase 4 |
| RFC | Archived in [`rfcs/completed/`](../rfcs/completed/RFC-0001-passkeys-poc-completion.md) |

---

## Slide 16 — How to Replicate

### Setup + workflow for a new product

**Initial setup — ~1 hour, done once:**

```
new-project/
├── CLAUDE.md              # overview + commands
├── AGENTS.md              # rules + phase mapping
├── tasks/
│   └── _template-phase.md
└── rfcs/
    └── _template-rfc.md
```

**For each new initiative:**

```
1. Write RFC + scaffold    /feature-dev create harness for RFC-XXXX
2. Execute phase by phase  /feature-dev execute phase X
3. Document                /feature-dev execute phase N  (docs phase)
```

---

## Slide 17 — Lessons Learned

### What works and what requires discipline

**What works:**
- ✅ Status files beat conversation history for persistent state
- ✅ Orchestrator instructions embedded in task files eliminate copy-paste
- ✅ Separate documentation phase keeps docs from going stale
- ✅ Verifiable completion criterion eliminates ambiguity
- ✅ BMad skills layer + harness state layer = complete workflow system

**What requires discipline:**
- ⚠️ Token tracking — fill it in immediately, not later
- ⚠️ Some steps are inherently manual (e.g. installing CA on device)
- ⚠️ AGENTS.md needs maintenance as architecture evolves

---

## Slide 18 — Stack Summary

### Everything that was used — and why

| Layer | Tool | Role |
|---|---|---|
| Skills & workflows | **BMad** | Structured agent behavior via slash commands |
| Orchestration | **feature-dev skill** | Coordinates parallel sub-agents |
| State tracking | **Task files** | Persistent state across tools and sessions |
| Specification | **RFC + templates** | Plan before code, replicable structure |
| Conventions | **[AGENTS.md](../AGENTS.md) + [CLAUDE.md](../CLAUDE.md)** | Shared rules for humans and agents |
| Execution | **Cursor + Claude Code** | Interchangeable — state lives in files |

---

## Slide 19 — Next Steps + Q&A

### What comes next

**For this project:**
- RFC-0002: certificate strategy for end users in production (Let's Encrypt + custom domain per client)

**For the team:**
- Identify the next product candidate to use this harness
- Estimated onboarding: 1h setup + 1h RFC writing

> *Which team project today suffers most from coordination loss and context drift between sessions?*

---

*Generated with [Claude Code](https://claude.ai/code) · [BMad](https://github.com/bmadcode/bmad-method)*
