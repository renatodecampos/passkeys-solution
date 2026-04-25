# Fase 1 — UX do app Android (RFC-0002)

**Status da fase**: `[x] completed`
**Agente responsável**: Cursor Agent
**Iniciado em**: 2026-04-25T12:00:00Z
**Concluído em**: 2026-04-25T12:30:00Z

---

## Pré-requisito

`tasks/rfc-0001/fase-4-documentacao.md` deve estar `[x] completed`.

---

## Critério de conclusão

```bash
cd passkeys-app && npm test && npm run lint
# testes passam e lint não reporta erros
```

A fase só está completa quando este comando retorna a saída esperada.

---

## Subtarefas

### 1.1 — Calm Card na entrada
- **Status**: `[x] completed`
- **depends_on**: []
- **Arquivo**: `passkeys-app/app/index.tsx`
- **O que fazer**: Implementar a hierarquia visual da especificação UX: passkey hero, copy curta, label visível de username, botões "Create passkey" e "Sign in with passkey", tokens locais de cor/spacing.
- **Verificação**: Tela de entrada mantém registro e login funcionando sem importar HTTP fora de `services/api.ts`.

### 1.2 — Formulário keyboard-safe
- **Status**: `[x] completed`
- **depends_on**: [1.1]
- **Arquivo**: `passkeys-app/app/index.tsx`
- **O que fazer**: Usar `KeyboardAvoidingView` e `ScrollView` para manter input, ações e status visíveis quando o teclado Android estiver aberto.
- **Verificação**: Em emulador, focar username não esconde ações nem feedback.

### 1.3 — Feedback inline e erros diagnósticos
- **Status**: `[x] completed`
- **depends_on**: [1.1]
- **Arquivo**: `passkeys-app/app/index.tsx`, `passkeys-app/services/api.ts`
- **O que fazer**: Substituir `Alert` por status inline persistente; diferenciar username vazio, loading, sucesso, cancelamento do prompt, credencial ausente e setup local quando houver sinal suficiente.
- **Verificação**: Nenhum prompt nativo é acionado com username vazio; loading desabilita botões; erros são exibidos na tela.

### 1.4 — Home Proof
- **Status**: `[x] completed`
- **depends_on**: [1.3]
- **Arquivo**: `passkeys-app/app/home.tsx`
- **O que fazer**: Implementar tela autenticada com username, status `verified: true`, método `passkey`, tipo de resposta `JSON` e logout.
- **Verificação**: Após registro/login bem-sucedido, a home mostra prova resumida da verificação do servidor.

---

## Parallelism map

```
1.1 ─┬→ 1.2 ─┐
     └→ 1.3 ─┴→ 1.4
```

1.2 e 1.3 podem rodar em paralelo após 1.1.

---

## Instruções para o Orquestrador

> Estas instruções são lidas automaticamente quando você executa `/feature-dev execute RFC-0002 fase 1`

**Pré-condição**: verifique que `tasks/rfc-0001/fase-4-documentacao.md` está `[x] completed`. Se não estiver, pare e informe.

**Ao iniciar**: atualize o cabeçalho deste arquivo — `Status da fase` para `[~] in_progress`, `Agente responsável` com seu nome, `Iniciado em` com timestamp ISO.

### BATCH A — sequencial

Execute **1.1**:
- Leia `rfcs/completed/RFC-0002-ux-passkeys-poc.md`
- Leia `_bmad-output/planning-artifacts/ux-design-specification.md`
- Atualize `passkeys-app/app/index.tsx` com a direção Calm Card
- Preserve a regra: `react-native-passkey` só em `app/index.tsx`
- Marque 1.1 `[x] completed` ou `[!] blocked`

### BATCH B — paralelo

Dispare dois sub-agentes simultaneamente:

**Sub-agente 1 — Keyboard-safe**
- Execute 1.2 em `passkeys-app/app/index.tsx`
- Valide que input, botões e status permanecem acessíveis com teclado aberto
- Marque 1.2 `[x] completed` ou `[!] blocked`

**Sub-agente 2 — Feedback e erros**
- Execute 1.3 em `passkeys-app/app/index.tsx` e, se necessário, `passkeys-app/services/api.ts`
- Não coloque lógica de passkey ou fetch direto em componentes fora dos limites existentes
- Marque 1.3 `[x] completed` ou `[!] blocked`

**Aguarde os dois** antes de avançar.

### BATCH C — sequencial

Execute **1.4**:
- Atualize `passkeys-app/app/home.tsx` para Home Proof
- Garanta que logout retorna para `/` sem apagar passkey
- Marque 1.4 `[x] completed` ou `[!] blocked`

### Finalização
- Rode `cd passkeys-app && npm test && npm run lint`
- Todos completos e verificação passando → atualize `Status da fase` para `[x] completed` com `Concluído em`
- Algum bloqueio → atualize `Status da fase` para `[!] blocked` e registre em Blockers

---

## Blockers

_Nenhum bloqueio registrado._

---

## Notas

- `npm run lint` do app estava acionando `eslint` via `.bin` com `require('../package.json')` quebrado; o script de lint em `passkeys-app/package.json` foi ajustado para chamar `node ./node_modules/eslint/bin/eslint.js .` (mesma config do Expo).
- Parâmetros de rota `verified`, `authMethod`, `responseType` passados no `replace` pós `verifyRegistration` / `verifyAuthentication` para a Home Proof.

---

## Token Usage

| Campo | Valor |
|-------|-------|
| Ferramenta | Cursor (agente, execução fase 1) |
| Tokens consumidos | 78,6k (≈78.6k) |
| Janela de contexto | 39,3% utilizada |
| Observação | Medição informada após conclusão desta fase. |
