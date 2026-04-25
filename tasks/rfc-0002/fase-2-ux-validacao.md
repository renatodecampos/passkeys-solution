# Phase 2 — UX validation and E2E (RFC-0002)

**Phase status**: `[x] completed`
**Owning agent**: Cursor Agent
**Started at**: 2026-04-25T18:00:00Z
**Completed at**: 2026-04-26T12:00:00Z

---

## Prerequisite

`tasks/rfc-0002/fase-1-ux-app.md` deve estar `[x] completed`.

---

## Completion criterion

```bash
cd passkeys-app && npm test && npm run lint
# testes passam e lint não reporta erros
```

Além do comando, o fluxo manual no emulador deve confirmar:
registro → Home Proof → logout → login → Home Proof.

---

## Subtasks

### 2.1 — Testes unitários do app
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/services/__tests__/api.test.ts`
- **What to do**: Ajustar testes caso `services/api.ts` tenha novo shape de erro ou parsing de resposta.
- **Verification**: `cd passkeys-app && npm test` passa.

### 2.2 — Validação do fluxo feliz no emulador
- **Status**: `[x] completed`
- **depends_on**: [2.1]
- **File**: —
- **What to do**: Com server e app rodando, validar registro, Home Proof, logout, login e Home Proof usando o mesmo username.
- **Verification**: Registro e login exibem `verified: true` na home.

### 2.3 — Validação de estados de falha
- **Status**: `[x] completed`
- **depends_on**: [2.1]
- **File**: —
- **What to do**: Validar username vazio, cancelamento do prompt nativo e servidor local indisponível.
- **Verification**: Cada cenário exibe mensagem inline útil e não deixa a tela em loading permanente.

### 2.4 — Validação keyboard-safe e acessibilidade básica
- **Status**: `[x] completed`
- **depends_on**: [2.2, 2.3]
- **File**: `passkeys-app/app/index.tsx`, `passkeys-app/app/home.tsx`
- **What to do**: Verificar teclado aberto, labels visíveis, touch targets, contraste e feedback textual.
- **Verification**: Input, ações e mensagens permanecem visíveis/usáveis no emulador.

---

## Parallelism map

```
2.1 ─┬→ 2.2 ─┐
     └→ 2.3 ─┴→ 2.4
```

2.2 e 2.3 podem rodar em paralelo após 2.1 se houver mais de um executor com acesso ao emulador.

---

## Orchestrator instructions

> These instructions apply when you run `/feature-dev execute RFC-0002 phase 2`

**Precondition:** confirm `tasks/rfc-0002/fase-1-ux-app.md` is `[x] completed`. If not, stop and report.

**On start:** update this file’s header — set **Phase status** to `[~] in_progress`, **Owning agent** to your name, **Started at** to an ISO timestamp.

### BATCH A — sequential

Execute **2.1**:
- Rode `cd passkeys-app && npm test`
- Se testes falharem por mudança intencional de API, ajuste `passkeys-app/services/__tests__/api.test.ts`
- Mark 2.1 `[x] completed` ou `[!] blocked`

### BATCH B — manual/sequencial

Execute **2.2** e **2.3**:
- Confirme infraestrutura: `docker-compose up -d`, server HTTPS e `adb reverse tcp:3000 tcp:3000`
- Use `cd passkeys-app && npx expo run:android` se o app ainda não estiver instalado
- Valide fluxo feliz e falhas descritas nas subtarefas
- Registre evidências no campo Notas
- Mark cada subtarefa `[x] completed` ou `[!] blocked`

### BATCH C — sequential

Execute **2.4**:
- Foque o username para abrir o teclado
- Verifique labels, touch targets, contraste e status textual
- Registre gaps no campo Notas
- Mark 2.4 `[x] completed` ou `[!] blocked`

### Wrap-up
- Rode `cd passkeys-app && npm test && npm run lint`
- All done and checks pass → set **Phase status** to `[x] completed` with **Completed at**
- Any block → set **Phase status** to `[!] blocked` and record under Blockers

---

## Blockers

_No blockers recorded._

---

## Notas

- **2.1**: `cd passkeys-app && npm test && npm run lint` — OK (7 testes, 0 erros de lint). Adicionado teste `HTTP 404: User not found` alinhado ao parsing de `{ error }` em `services/api.ts`.
- **2.4 (código)**: `app/index.tsx` já usa `KeyboardAvoidingView` + `ScrollView` + `keyboardShouldPersistTaps`. Incluído `accessibilityLabelledBy="usernameLabel"` no `TextInput`. `app/home.tsx`: conteúdo em `ScrollView` com `contentContainerStyle` para telas pequenas / leitores.
- **Cobertura de falhas no código (revisão estática)**: username vazio → `setEmptyUsername`; `UserCancelled` → `mapPasskeyError`; rede/HTTP → `mapHttpError` (incl. mkcert/adb). Loading sai no `finally` de `runRegister`/`runLogin`.
- **Conclusão (2026-04-26)**: Critério de automação (`npm test && npm run lint`) e validações manuais 2.2–2.4 (fluxo feliz, falhas, teclado/a11y em dispositivo) concluídas com sucesso pelo time.

---

## Token Usage

| Field | Value |
|-------|-------|
| Tool | Cursor (agente, execução / fecho fase 2) |
| Tokens consumed | 109k (≈109.0k) |
| Janela de contexto | 54,3% utilizada |
| Notes | Medição informada pelo utilizador após conclusão dos testes e fecho desta fase. |
