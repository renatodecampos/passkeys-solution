# Phase {{NUMERO}} — {{TITULO}}

> Template: copy this file to `tasks/rfc-XXXX/fase-{{NUMERO}}-{{slug}}.md` and fill in fields
> marked with `{{}}`. Each RFC has its own `tasks/rfc-xxxx/` folder; phase numbers restart at 1.
>
> When registering this phase in `tasks/feedback-forward.md`, use the section format:
> `## RFC-{ID} — {Full RFC title}` (e.g. `## RFC-0003 — My New Initiative`).
> The full title is in the `title:` field of the RFC file under `rfcs/`.

**Phase status**: `[ ] pending`  
**Owning agent**: —  
**Started at**: —  
**Completed at**: —

---

## Prerequisite

{{FASE_ANTERIOR}} must be `[x] completed`. (Remove this section if it is the first phase.)

---

## Completion criterion

```bash
{{COMANDO_DE_VERIFICACAO}}
# {{SAIDA_ESPERADA}}
```

The phase is complete only when this command produces the expected output.

---

## Subtasks

### {{NUMERO}}.1 — {{TITULO_SUBTAREFA}}
- **Status**: `[ ] pending`
- **depends_on**: []
- **File**: `{{CAMINHO_DO_ARQUIVO}}`
- **What to do**: {{DESCRICAO}}
- **Verification**: {{CRITERIO}}
<!-- If this subtask needs hardware (emulator, physical device) or manual OS interaction,
     add the tag: **[manual action]** — and keep it out of the parallelism map so it does not block other batches. -->

### {{NUMERO}}.2 — {{TITULO_SUBTAREFA}}
- **Status**: `[ ] pending`
- **depends_on**: [{{NUMERO}}.1]
- **File**: `{{CAMINHO_DO_ARQUIVO}}`
- **What to do**: {{DESCRICAO}}
- **Verification**: {{CRITERIO}}

<!-- Add more subtasks as needed -->

<!-- NOTE: Documentation is not part of this phase. It is consolidated in the Documentation
     phase (last phase of each RFC). Record non-obvious decisions in ## Notes
     so the Docs phase can reuse them. -->

> **Rule (documentation phase — last phase of the RFC):**  
> In the subtask *Update project documentation* (or equivalent), the **files to list** must
> include, when they exist, **root `README.md`** (entry for clone/GitHub) **in addition to**
> `CLAUDE.md` and relevant module READMEs (e.g. `passkeys-app/README.md`). Only omit the
> root README if the RFC explicitly names another file as the entry point. Summarize and link; do
> not duplicate the RFC.

---

## Parallelism map

```
{{NUMERO}}.1 ─┐
              ├→ {{NUMERO}}.N  (independent subtasks run in parallel)
{{NUMERO}}.2 ─┘
```

---

## Orchestrator instructions

> These instructions are read when you run `/feature-dev execute RFC-XXXX phase {{IDENTIFICADOR}}`

**Precondition:** confirm `tasks/rfc-xxxx/{{ARQUIVO_FASE_ANTERIOR}}` is `[x] completed`. If not, stop and report.

**On start:** update the header of this file — **Phase status** to `[~] in_progress`, **Owning agent** with your name, **Started at** with an ISO timestamp.

### BATCH A — {{parallel|sequential}}
<!-- Describe the first batch. Say whether sub-agents run in parallel or serially. -->

**Sub-agent 1 — {{NOME}}**
- {{INSTRUCOES}}
- Mark {{NUMERO}}.X `[~] in_progress` when starting, `[x] completed` or `[!] blocked` when done

**Sub-agent 2 — {{NOME}}** (if parallel)
- {{INSTRUCOES}}
- Mark {{NUMERO}}.X `[~] in_progress` when starting, `[x] completed` or `[!] blocked` when done

**Wait for all sub-agents** before continuing.

### BATCH B — sequential
<!-- Add further batches as needed -->

### Wrap-up
- All done → set **Phase status** to `[x] completed` with **Completed at**
- Any block → set **Phase status** to `[!] blocked` and record under Blockers

---

## Blockers

_No blockers recorded._

---

## Notes

_Free form for the agent to record observations during execution._

---

## Feedback Forward

> **Required** — filled by the agent before marking the phase `[x] completed`.  
> When done, copy relevant insights to `tasks/feedback-forward.md` (cross-RFC log).

### What went well
- 

### What caused friction / rework
- 

### Suggested harness updates

| File | Section | Suggested change |
|------|---------|------------------|
| | | |

### Applied?
`[ ]` Not yet — pending Documentation phase of this RFC

---

## Token usage

> Fill with the value shown in the Claude Code or Cursor UI at the end of the phase.

| Field | Value |
|-------|-------|
| Tool | — |
| Tokens consumed | — |
| Notes | — |
