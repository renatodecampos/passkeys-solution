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

### Estado atual

{{ESTADO_ATUAL_DO_SISTEMA}}

### Glossário

| Termo | Significado |
|-------|-------------|
| {{TERMO}} | {{DEFINICAO}} |

## Problem Statement

{{PROBLEMA_ESPECIFICO}}

**Impacto de não resolver**: {{CUSTO_RISCO_OU_OPORTUNIDADE}}

## Goals & Non-Goals

### Goals
- {{META_1}}

### Non-Goals
- {{FORA_DO_ESCOPO}}

## Evaluation Criteria

| Critério | Peso | Descrição |
|----------|------|-----------|
| {{CRITERIO}} | Alto/Médio/Baixo | {{DESCRICAO}} |

## Options Analysis

### Opção 1: {{NOME}}

**Descrição**: {{DESCRICAO}}

**Vantagens**:
- {{PRO}}

**Desvantagens**:
- {{CON}}

**Avaliação contra critérios**:
| Critério | Avaliação | Notas |
|----------|-----------|-------|
| {{CRITERIO}} | {{AVALIACAO}} | {{NOTA}} |

**Esforço**: {{ESTIMATIVA}}
**Risco**: {{RISCO}}

---

### Opção 2: {{NOME}}

<!-- Repita a estrutura acima -->

## Recommendation

**{{OPCAO_RECOMENDADA}}**

{{JUSTIFICATIVA_BASEADA_NOS_CRITERIOS}}

---

## Technical Design

### {{TITULO_SECAO}}

{{CONTEUDO}}

## Implementation Plan

### Fase 1 — {{TITULO}}

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 1.1 | `{{ARQUIVO}}` | {{DESCRICAO}} |

**Critério de conclusão**: {{COMANDO_E_SAIDA_ESPERADA}}

<!-- Adicione mais fases conforme necessário -->

### Fase N — Documentação

Última fase de toda RFC. Executada após todas as demais estarem `[x] completed`.
Arquivo de tasks da última fase (documentação): `tasks/rfc-XXXX/fase-N-documentacao.md` (pasta
por RFC, use `tasks/_template-fase.md` como base).

Escopo fixo:
- Atualizar `CLAUDE.md` com setup não óbvio e decisões técnicas relevantes
- Atualizar READMEs afetados
- Mover RFC para `rfcs/completed/` e preencher `## Decision Record`

**Critério de conclusão**: novo dev consegue subir o ambiente lendo apenas `CLAUDE.md`.

### Rollback

{{ESTRATEGIA_DE_ROLLBACK}}

## Open Questions

1. **{{QUESTAO}}**: {{DESCRICAO}}

## Decision Record

_A ser preenchido após revisão._
