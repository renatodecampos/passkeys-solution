# Fase 2 — Validação UX e E2E (RFC-0002)

**Status da fase**: `[x] completed`
**Agente responsável**: Cursor Agent
**Iniciado em**: 2026-04-25T18:00:00Z
**Concluído em**: 2026-04-26T12:00:00Z

---

## Pré-requisito

`tasks/rfc-0002/fase-1-ux-app.md` deve estar `[x] completed`.

---

## Critério de conclusão

```bash
cd passkeys-app && npm test && npm run lint
# testes passam e lint não reporta erros
```

Além do comando, o fluxo manual no emulador deve confirmar:
registro → Home Proof → logout → login → Home Proof.

---

## Subtarefas

### 2.1 — Testes unitários do app
- **Status**: `[x] completed`
- **depends_on**: []
- **Arquivo**: `passkeys-app/services/__tests__/api.test.ts`
- **O que fazer**: Ajustar testes caso `services/api.ts` tenha novo shape de erro ou parsing de resposta.
- **Verificação**: `cd passkeys-app && npm test` passa.

### 2.2 — Validação do fluxo feliz no emulador
- **Status**: `[x] completed`
- **depends_on**: [2.1]
- **Arquivo**: —
- **O que fazer**: Com server e app rodando, validar registro, Home Proof, logout, login e Home Proof usando o mesmo username.
- **Verificação**: Registro e login exibem `verified: true` na home.

### 2.3 — Validação de estados de falha
- **Status**: `[x] completed`
- **depends_on**: [2.1]
- **Arquivo**: —
- **O que fazer**: Validar username vazio, cancelamento do prompt nativo e servidor local indisponível.
- **Verificação**: Cada cenário exibe mensagem inline útil e não deixa a tela em loading permanente.

### 2.4 — Validação keyboard-safe e acessibilidade básica
- **Status**: `[x] completed`
- **depends_on**: [2.2, 2.3]
- **Arquivo**: `passkeys-app/app/index.tsx`, `passkeys-app/app/home.tsx`
- **O que fazer**: Verificar teclado aberto, labels visíveis, touch targets, contraste e feedback textual.
- **Verificação**: Input, ações e mensagens permanecem visíveis/usáveis no emulador.

---

## Parallelism map

```
2.1 ─┬→ 2.2 ─┐
     └→ 2.3 ─┴→ 2.4
```

2.2 e 2.3 podem rodar em paralelo após 2.1 se houver mais de um executor com acesso ao emulador.

---

## Instruções para o Orquestrador

> Estas instruções são lidas automaticamente quando você executa `/feature-dev execute RFC-0002 fase 2`

**Pré-condição**: verifique que `tasks/rfc-0002/fase-1-ux-app.md` está `[x] completed`. Se não estiver, pare e informe.

**Ao iniciar**: atualize o cabeçalho deste arquivo — `Status da fase` para `[~] in_progress`, `Agente responsável` com seu nome, `Iniciado em` com timestamp ISO.

### BATCH A — sequencial

Execute **2.1**:
- Rode `cd passkeys-app && npm test`
- Se testes falharem por mudança intencional de API, ajuste `passkeys-app/services/__tests__/api.test.ts`
- Marque 2.1 `[x] completed` ou `[!] blocked`

### BATCH B — manual/sequencial

Execute **2.2** e **2.3**:
- Confirme infraestrutura: `docker-compose up -d`, server HTTPS e `adb reverse tcp:3000 tcp:3000`
- Use `cd passkeys-app && npx expo run:android` se o app ainda não estiver instalado
- Valide fluxo feliz e falhas descritas nas subtarefas
- Registre evidências no campo Notas
- Marque cada subtarefa `[x] completed` ou `[!] blocked`

### BATCH C — sequencial

Execute **2.4**:
- Foque o username para abrir o teclado
- Verifique labels, touch targets, contraste e status textual
- Registre gaps no campo Notas
- Marque 2.4 `[x] completed` ou `[!] blocked`

### Finalização
- Rode `cd passkeys-app && npm test && npm run lint`
- Todos completos e verificação passando → atualize `Status da fase` para `[x] completed` com `Concluído em`
- Algum bloqueio → atualize `Status da fase` para `[!] blocked` e registre em Blockers

---

## Blockers

_Nenhum bloqueio registrado._

---

## Notas

- **2.1**: `cd passkeys-app && npm test && npm run lint` — OK (7 testes, 0 erros de lint). Adicionado teste `HTTP 404: User not found` alinhado ao parsing de `{ error }` em `services/api.ts`.
- **2.4 (código)**: `app/index.tsx` já usa `KeyboardAvoidingView` + `ScrollView` + `keyboardShouldPersistTaps`. Incluído `accessibilityLabelledBy="usernameLabel"` no `TextInput`. `app/home.tsx`: conteúdo em `ScrollView` com `contentContainerStyle` para telas pequenas / leitores.
- **Cobertura de falhas no código (revisão estática)**: username vazio → `setEmptyUsername`; `UserCancelled` → `mapPasskeyError`; rede/HTTP → `mapHttpError` (incl. mkcert/adb). Loading sai no `finally` de `runRegister`/`runLogin`.
- **Conclusão (2026-04-26)**: Critério de automação (`npm test && npm run lint`) e validações manuais 2.2–2.4 (fluxo feliz, falhas, teclado/a11y em dispositivo) concluídas com sucesso pelo time.

---

## Token Usage

| Campo | Valor |
|-------|-------|
| Ferramenta | Cursor (agente, execução / fecho fase 2) |
| Tokens consumidos | 109k (≈109.0k) |
| Janela de contexto | 54,3% utilizada |
| Observação | Medição informada pelo utilizador após conclusão dos testes e fecho desta fase. |
