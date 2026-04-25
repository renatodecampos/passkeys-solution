---
rfc_id: RFC-{{NUMERO}}
title: {{TITULO}}
status: DRAFT
author: {{AUTOR}}
reviewers: []
created: {{DATA}}
last_updated: {{DATA}}
decision_date:
---

# RFC-{{NUMERO}}: {{TITULO}}

## Overview

{{DESCRICAO_EM_1_2_PARAGRAFOS}}

## Background & Context

### Current state

{{ESTADO_ATUAL_DO_SISTEMA}}

### Glossary

| Term | Definition |
|------|------------|
| {{TERMO}} | {{DEFINICAO}} |

## Problem Statement

{{PROBLEMA_ESPECIFICO}}

**If we do not address this**: {{CUSTO_RISCO_OU_OPORTUNIDADE}}

## Goals & Non-Goals

### Goals
- {{META_1}}

### Non-Goals
- {{FORA_DO_ESCOPO}}

## Evaluation Criteria

| Criterion | Weight | Description |
|----------|--------|-------------|
| {{CRITERIO}} | High / Medium / Low | {{DESCRICAO}} |

## Options Analysis

### Option 1: {{NOME}}

**Description**: {{DESCRICAO}}

**Pros**:
- {{PRO}}

**Cons**:
- {{CON}}

**Scoring**:
| Criterion | Score | Notes |
|----------|-------|-------|
| {{CRITERIO}} | {{AVALIACAO}} | {{NOTA}} |

**Effort**: {{ESTIMATIVA}}  
**Risk**: {{RISCO}}

---

### Option 2: {{NOME}}

<!-- Repeat the structure above -->

## Recommendation

**{{OPCAO_RECOMENDADA}}**

{{JUSTIFICATIVA_BASEADA_NOS_CRITERIOS}}

---

## Technical Design

### {{TITULO_SECAO}}

{{CONTEUDO}}

## Implementation Plan

### Phase 1 — {{TITULO}}

| Step | File(s) | Description |
|------|---------|-------------|
| 1.1 | `{{ARQUIVO}}` | {{DESCRICAO}} |

**Completion criterion**: {{COMANDO_E_SAIDA_ESPERADA}}

<!-- Add more phases as needed -->

### Phase N — Documentation

Last phase of every RFC. Run after all others are `[x] completed`.  
Task file for the last phase: `tasks/rfc-XXXX/fase-N-documentacao.md` (per-RFC folder; use `tasks/_template-fase.md` as the base).

Fixed scope:
- Update `CLAUDE.md` with non-obvious setup and relevant technical decisions
- Update affected READMEs
- Move RFC to `rfcs/completed/` and complete `## Decision Record`

**Completion criterion:** a new developer can bring up the environment using only `CLAUDE.md`.

### Rollback

{{ESTRATEGIA_DE_ROLLBACK}}

## Open Questions

1. **{{QUESTAO}}**: {{DESCRICAO}}

## Decision Record

_To be filled in after review._
