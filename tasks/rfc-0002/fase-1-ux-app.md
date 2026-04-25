# Phase 1 — Android app UX (RFC-0002)

**Phase status**: `[x] completed`
**Owning agent**: Cursor Agent
**Started at**: 2026-04-25T12:00:00Z
**Completed at**: 2026-04-25T12:30:00Z

---

## Prerequisite

`tasks/rfc-0001/fase-4-documentacao.md` deve estar `[x] completed`.

---

## Completion criterion

```bash
cd passkeys-app && npm test && npm run lint
# testes passam e lint não reporta erros
```

A fase só está completa quando este comando retorna a saída esperada.

---

## Subtasks

### 1.1 — Calm Card na entrada
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/app/index.tsx`
- **What to do**: Implementar a hierarquia visual da especificação UX: passkey hero, copy curta, label visível de username, botões "Create passkey" e "Sign in with passkey", tokens locais de cor/spacing.
- **Verification**: Tela de entrada mantém registro e login funcionando sem importar HTTP fora de `services/api.ts`.

### 1.2 — Formulário keyboard-safe
- **Status**: `[x] completed`
- **depends_on**: [1.1]
- **File**: `passkeys-app/app/index.tsx`
- **What to do**: Usar `KeyboardAvoidingView` e `ScrollView` para manter input, ações e status visíveis quando o teclado Android estiver aberto.
- **Verification**: Em emulador, focar username não esconde ações nem feedback.

### 1.3 — Feedback inline e erros diagnósticos
- **Status**: `[x] completed`
- **depends_on**: [1.1]
- **File**: `passkeys-app/app/index.tsx`, `passkeys-app/services/api.ts`
- **What to do**: Substituir `Alert` por status inline persistente; diferenciar username vazio, loading, sucesso, cancelamento do prompt, credencial ausente e setup local quando houver sinal suficiente.
- **Verification**: Nenhum prompt nativo é acionado com username vazio; loading desabilita botões; erros são exibidos na tela.

### 1.4 — Home Proof
- **Status**: `[x] completed`
- **depends_on**: [1.3]
- **File**: `passkeys-app/app/home.tsx`
- **What to do**: Implementar tela autenticada com username, status `verified: true`, método `passkey`, tipo de resposta `JSON` e logout.
- **Verification**: Após registro/login bem-sucedido, a home mostra prova resumida da verificação do servidor.

---

## Parallelism map

```
1.1 ─┬→ 1.2 ─┐
     └→ 1.3 ─┴→ 1.4
```

1.2 e 1.3 podem rodar em paralelo após 1.1.

---

## Orchestrator instructions

> These instructions apply when you run `/feature-dev execute RFC-0002 phase 1`

**Precondition:** confirm `tasks/rfc-0001/fase-4-documentacao.md` is `[x] completed`. If not, stop and report.

**On start:** update this file’s header — set **Phase status** to `[~] in_progress`, **Owning agent** to your name, **Started at** to an ISO timestamp.

### BATCH A — sequential

Execute **1.1**:
- Leia `rfcs/completed/RFC-0002-ux-passkeys-poc.md`
- Leia `_bmad-output/planning-artifacts/ux-design-specification.md`
- Atualize `passkeys-app/app/index.tsx` com a direção Calm Card
- Preserve a regra: `react-native-passkey` só em `app/index.tsx`
- Mark 1.1 `[x] completed` ou `[!] blocked`

### BATCH B — parallel

Run two sub-agents in parallel:

**Sub-agent 1 — Keyboard-safe**
- Execute 1.2 em `passkeys-app/app/index.tsx`
- Valide que input, botões e status permanecem acessíveis com teclado aberto
- Mark 1.2 `[x] completed` ou `[!] blocked`

**Sub-agent 2 — Feedback e erros**
- Execute 1.3 em `passkeys-app/app/index.tsx` e, se necessário, `passkeys-app/services/api.ts`
- Não coloque lógica de passkey ou fetch direto em componentes fora dos limites existentes
- Mark 1.3 `[x] completed` ou `[!] blocked`

**Wait for both** before continuing.

### BATCH C — sequential

Execute **1.4**:
- Atualize `passkeys-app/app/home.tsx` para Home Proof
- Garanta que logout retorna para `/` sem apagar passkey
- Mark 1.4 `[x] completed` ou `[!] blocked`

### Wrap-up
- Rode `cd passkeys-app && npm test && npm run lint`
- All done and checks pass → set **Phase status** to `[x] completed` with **Completed at**
- Any block → set **Phase status** to `[!] blocked` and record under Blockers

---

## Blockers

_No blockers recorded._

---

## Notas

- `npm run lint` do app estava acionando `eslint` via `.bin` com `require('../package.json')` quebrado; o script de lint em `passkeys-app/package.json` foi ajustado para chamar `node ./node_modules/eslint/bin/eslint.js .` (mesma config do Expo).
- Parâmetros de rota `verified`, `authMethod`, `responseType` passados no `replace` pós `verifyRegistration` / `verifyAuthentication` para a Home Proof.

---

## Token Usage

| Field | Value |
|-------|-------|
| Tool | Cursor (agente, execução fase 1) |
| Tokens consumed | 78,6k (≈78.6k) |
| Janela de contexto | 39,3% utilizada |
| Notes | Medição informada após conclusão desta fase. |
