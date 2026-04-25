# Fase {{NUMERO}} — {{TITULO}}

> Template: copie este arquivo para `tasks/rfc-XXXX/fase-{{NUMERO}}-{{slug}}.md` e preencha os
> campos marcados com `{{}}`. Cada RFC tem sua pasta `tasks/rfc-xxxx/`; as fases recomeçam em 1.
>
> Ao registrar esta fase em `tasks/feedback-forward.md`, use o formato de seção:
> `## RFC-{ID} — {Título completo da RFC}` (ex: `## RFC-0003 — Minha Nova Iniciativa`).
> O título completo está no campo `title:` do arquivo da RFC em `rfcs/`.

**Status da fase**: `[ ] pending`
**Agente responsável**: —
**Iniciado em**: —
**Concluído em**: —

---

## Pré-requisito

{{FASE_ANTERIOR}} deve estar `[x] completed`. (Remova esta seção se for a primeira fase.)

---

## Critério de conclusão

```bash
{{COMANDO_DE_VERIFICACAO}}
# {{SAIDA_ESPERADA}}
```

A fase só está completa quando este comando retorna a saída esperada.

---

## Subtarefas

### {{NUMERO}}.1 — {{TITULO_SUBTAREFA}}
- **Status**: `[ ] pending`
- **depends_on**: []
- **Arquivo**: `{{CAMINHO_DO_ARQUIVO}}`
- **O que fazer**: {{DESCRICAO}}
- **Verificação**: {{CRITERIO}}
<!-- Se esta subtarefa requer hardware (emulador, device físico) ou interação manual no SO,
     adicione a marcação: **[ação manual]** — e separe-a do parallelism map para não bloquear outros batches. -->

### {{NUMERO}}.2 — {{TITULO_SUBTAREFA}}
- **Status**: `[ ] pending`
- **depends_on**: [{{NUMERO}}.1]
- **Arquivo**: `{{CAMINHO_DO_ARQUIVO}}`
- **O que fazer**: {{DESCRICAO}}
- **Verificação**: {{CRITERIO}}

<!-- Adicione mais subtarefas conforme necessário -->

<!-- NOTA: Documentação não entra nesta fase. É consolidada na Fase de Documentação
     (última fase de cada RFC). Registre decisões não óbvias no campo ## Notas
     para que a Fase de Docs possa aproveitá-las. -->

> **Regra (fase de documentação — última fase da RFC):**  
> Na subtarefa *Atualizar documentação do projeto* (ou equivalente), os **ficheiros a listar** devem
> incluir, quando existirem, **`README.md` na raiz do repositório** (entrada para clone/GitHub) **além
> de** `CLAUDE.md` e READMEs de módulos relevantes (ex.: `passkeys-app/README.md`). Só exclua o
> README raiz se a RFC deixar explícito outro ficheiro como ponto de entrada. Resumir e ligar; não
> duplicar a RFC.

---

## Parallelism map

```
{{NUMERO}}.1 ─┐
              ├→ {{NUMERO}}.N  (subtarefas sem dependência rodam em paralelo)
{{NUMERO}}.2 ─┘
```

---

## Instruções para o Orquestrador

> Estas instruções são lidas automaticamente quando você executa `/feature-dev execute RFC-XXXX fase {{IDENTIFICADOR}}`

**Pré-condição**: verifique que `tasks/rfc-xxxx/{{ARQUIVO_FASE_ANTERIOR}}` está `[x] completed`. Se não estiver, pare e informe.

**Ao iniciar**: atualize o cabeçalho deste arquivo — `Status da fase` para `[~] in_progress`, `Agente responsável` com seu nome, `Iniciado em` com timestamp ISO.

### BATCH A — {{paralelo|sequencial}}
<!-- Descreva o primeiro batch. Indique se os sub-agentes rodam em paralelo ou sequencialmente. -->

**Sub-agente 1 — {{NOME}}**
- {{INSTRUCOES}}
- Marque {{NUMERO}}.X `[~] in_progress` ao começar, `[x] completed` ou `[!] blocked` ao terminar

**Sub-agente 2 — {{NOME}}** (se paralelo)
- {{INSTRUCOES}}
- Marque {{NUMERO}}.X `[~] in_progress` ao começar, `[x] completed` ou `[!] blocked` ao terminar

**Aguarde todos os sub-agentes** antes de avançar.

### BATCH B — sequencial
<!-- Descreva os batches seguintes conforme necessário -->

### Finalização
- Todos completos → atualize `Status da fase` para `[x] completed` com `Concluído em`
- Algum bloqueio → atualize `Status da fase` para `[!] blocked` e registre em Blockers

---

## Blockers

_Nenhum bloqueio registrado._

---

## Notas

_Campo livre para o agente registrar observações durante a execução._

---

## Feedback Forward

> **Obrigatório** — preenchido pelo agente antes de marcar a fase como `[x] completed`.
> Ao concluir, copie os insights relevantes para `tasks/feedback-forward.md` (acumulador cross-RFC).

### O que funcionou bem
- 

### O que atrapalhou / gerou retrabalho
- 

### Atualizações sugeridas para o harness

| Arquivo | Seção | Mudança sugerida |
|---------|-------|-----------------|
| | | |

### Aplicado?
`[ ]` Ainda não — pendente para a fase de Documentação desta RFC

---

## Token Usage

> Preencha com o valor exibido na UI do Claude Code ou Cursor ao final da fase.

| Campo | Valor |
|-------|-------|
| Ferramenta | — |
| Tokens consumidos | — |
| Observação | — |
