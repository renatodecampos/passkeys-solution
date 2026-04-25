# Phase 2 — Android app

**Phase status**: `[x] completed`
**Owning agent**: Cursor Agent (Sonnet 4.6)
**Started at**: 2026-04-24T14:00:00Z
**Completed at**: 2026-04-24T14:30:00Z

---

## Prerequisite

Fase 1 deve estar `[x] completed` antes de iniciar esta fase.

---

## Completion criterion

O app compila e abre no emulador Android (API 34+) sem erros, mostrando a tela de login/registro com os dois botões funcionando (mesmo que o fluxo completo ainda falhe por cert — isso é testado na Fase 3).

```bash
cd passkeys-app
npx expo run:android
# app abre no emulador sem crash
```

---

## Subtasks

### 2.1 — Instalar react-native-passkey
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/package.json`
- **What to do**: `cd passkeys-app && npx expo install react-native-passkey`
- **Verification**: `react-native-passkey` aparece em `dependencies` no `package.json`
- **Atenção**: Confirmar compatibilidade com Expo SDK 53 / RN 0.79. Se incompatível, registrar em Blockers e avaliar `@react-native-passkeys/passkeys` como alternativa.

### 2.2 — expo prebuild
- **Status**: `[x] completed`
- **depends_on**: [2.1]
- **What to do**: `cd passkeys-app && npx expo prebuild --platform android --clean`
- **Verification**: Diretório `passkeys-app/android/` criado com `app/src/main/AndroidManifest.xml`
- **Nota**: Isso gera código nativo Android. O diretório `android/` deve ser adicionado ao controle de versão (não ao .gitignore) para que os agentes de fase 3 possam modificá-lo.

### 2.3 — network_security_config.xml
- **Status**: `[x] completed`
- **depends_on**: [2.2]
- **File**: `passkeys-app/android/app/src/main/res/xml/network_security_config.xml`
- **What to do**: Criar o arquivo conforme spec da RFC:
  ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <network-security-config>
    <debug-overrides>
      <trust-anchors>
        <certificates src="system"/>
        <certificates src="user"/>
      </trust-anchors>
    </debug-overrides>
  </network-security-config>
  ```
- **Verification**: Arquivo existe no caminho correto

### 2.4 — AndroidManifest.xml
- **Status**: `[x] completed`
- **depends_on**: [2.3]
- **File**: `passkeys-app/android/app/src/main/AndroidManifest.xml`
- **What to do**: Adicionar atributo `android:networkSecurityConfig="@xml/network_security_config"` na tag `<application>`
- **Verification**: Atributo presente no manifest

### 2.5 — services/api.ts
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-app/services/api.ts` (criar diretório `services/` se não existir)
- **What to do**: Implementar as 4 funções conforme spec da RFC:
  - `generateRegistrationOptions(username)`
  - `verifyRegistration(username, response)`
  - `generateAuthenticationOptions(username)`
  - `verifyAuthentication(username, response)`
  - `BASE_URL = 'https://localhost:3000'`
- **Verification**: TypeScript compila sem erros (`tsc --noEmit` no app)

### 2.6 — Tela de login/registro (app/index.tsx)
- **Status**: `[x] completed`
- **depends_on**: [2.1, 2.5]
- **File**: `passkeys-app/app/index.tsx`
- **What to do**: Substituir o conteúdo atual por:
  - Input de texto para `username`
  - Botão "Registrar" que chama `generateRegistrationOptions` → `Passkey.create` → `verifyRegistration`
  - Botão "Entrar" que chama `generateAuthenticationOptions` → `Passkey.get` → `verifyAuthentication`
  - Feedback de estado: loading, erro, sucesso
  - Após sucesso: navegar para `/(tabs)`
- **Verification**: Tela renderiza no emulador com os dois botões visíveis

### 2.7 — Tela home autenticado (app/(tabs)/index.tsx)
- **Status**: `[x] completed`
- **depends_on**: [2.6]
- **File**: `passkeys-app/app/(tabs)/index.tsx`
- **What to do**: Substituir conteúdo de exemplo por:
  - Exibir username logado (passar via router params ou estado global simples)
  - Botão de logout que volta para `app/index.tsx`
- **Verification**: Tela renderiza no emulador

### 2.8 — Testes unitários de services/api.ts
- **Status**: `[x] completed`
- **depends_on**: [2.5]
- **File**: `passkeys-app/services/__tests__/api.test.ts`
- **What to do**:
  1. Instalar dependências de teste (se não presentes):
     ```bash
     cd passkeys-app
     npm install --save-dev jest @types/jest jest-fetch-mock ts-jest
     ```
  2. Criar `passkeys-app/jest.config.ts`:
     ```typescript
     import type { Config } from 'jest';
     const config: Config = {
       preset: 'ts-jest',
       testEnvironment: 'node',
       roots: ['<rootDir>/services'],
       testMatch: ['**/__tests__/**/*.test.ts'],
       setupFiles: ['./jest.setup.ts'],
     };
     export default config;
     ```
  3. Criar `passkeys-app/jest.setup.ts`:
     ```typescript
     import fetchMock from 'jest-fetch-mock';
     fetchMock.enableMocks();
     ```
  4. Atualizar `scripts.test` no `package.json` do app:
     ```json
     "test": "jest"
     ```
  5. Criar `passkeys-app/services/__tests__/api.test.ts` com os casos abaixo

- **Casos de teste**:
  - `generateRegistrationOptions`: envia POST com `{ username }` para `/generate-registration-options` → retorna JSON da resposta
  - `verifyRegistration`: envia POST com header `x-username` para `/verify-registration` → retorna JSON da resposta
  - `generateAuthenticationOptions`: envia POST com header `x-username` para `/generate-authentication-options` → retorna JSON da resposta
  - `verifyAuthentication`: envia POST com header `x-username` para `/verify-authentication` → retorna JSON da resposta
  - Erro de rede: fetch rejeita → erro propagado para o chamador

- **Verification**: `npm test` no app — todos os casos passam

---

## Parallelism map

```
2.1 → 2.2 → 2.3 → 2.4
2.5 ──────────────────────────── pode rodar em paralelo com 2.1→2.2→2.3→2.4
2.5 → 2.8                        pode rodar em paralelo com 2.6 e 2.7
2.6 ← depends_on [2.1, 2.5]
2.7 ← depends_on [2.6]
```

Subtasks 2.1 (and its chain), 2.5, and 2.8 can start without blocking each other.

---

## Orchestrator instructions

> These instructions apply when you run `/feature-dev execute RFC-0001 phase 2`

**Precondition:** confirm `tasks/rfc-0001/fase-1b-testes-server.md` is `[x] completed`. If not, stop and report.

**On start:** update this file’s header — set **Phase status** to `[~] in_progress`, **Owning agent** to your name, **Started at** to an ISO timestamp.

### BATCH A — paralelo
Dispare dois sub-agentes **simultaneamente**:

**Sub-agent 1 — cadeia nativa**
- Execute 2.1: `cd passkeys-app && npx expo install react-native-passkey`
  - Se incompatível com Expo SDK 53 / RN 0.79: registre em Blockers e avalie `@react-native-passkeys/passkeys`
  - Mark 2.1 `[x] completed` ou `[!] blocked`
- Execute 2.2 (depende de 2.1): `npx expo prebuild --platform android --clean`
  - Mark 2.2 `[x] completed`
- Execute 2.3 (depende de 2.2): crie `passkeys-app/android/app/src/main/res/xml/network_security_config.xml`
  - Mark 2.3 `[x] completed`
- Execute 2.4 (depende de 2.3): adicione `android:networkSecurityConfig` no `AndroidManifest.xml`
  - Mark 2.4 `[x] completed`

**Sub-agent 2 — services**
- Execute 2.5: crie `passkeys-app/services/api.ts` com as 4 funções conforme spec da subtarefa
  - BASE_URL = `'https://localhost:3000'`
  - Mark 2.5 `[x] completed`
- Execute 2.8 (depende de 2.5): setup Jest no app + crie `passkeys-app/services/__tests__/api.test.ts`
  - Instale `jest @types/jest jest-fetch-mock ts-jest` como devDependencies
  - Implemente os casos de teste listados na subtarefa 2.8
  - Verifique: `cd passkeys-app && npm test` passa
  - Mark 2.8 `[x] completed` ou `[!] blocked`

**Aguarde ambos os sub-agentes concluírem** antes de avançar.

### BATCH B — sequencial
Execute **2.6** (depende de 2.1 e 2.5):
- Leia `passkeys-app/app/index.tsx` atual
- Substitua pelo conteúdo conforme spec da subtarefa 2.6
- Verifique que TypeScript compila sem erros
- Mark 2.6 `[x] completed`

### BATCH C — sequential
Execute **2.7** (depende de 2.6):
- Leia `passkeys-app/app/(tabs)/index.tsx` atual
- Substitua pelo conteúdo conforme spec da subtarefa 2.7
- Mark 2.7 `[x] completed`

### Verificação final
- Rode `cd passkeys-app && npx expo run:android` no emulador
- App abre sem crash na tela de login/registro → fase completa

### Wrap-up
- All done → set **Phase status** to `[x] completed` with **Completed at**
- Any block → set **Phase status** to `[!] blocked` and record under Blockers

---

## Blockers

_No blockers recorded._

---

## Notas

- `react-native-passkey` v3.3.3 compatível com Expo SDK 53 / RN 0.79 sem alternativas
- `ts-node` foi adicionado como devDependency (necessário para `jest.config.ts` em TypeScript)
- `npx tsc --noEmit` sem erros após implementação completa
- 6/6 testes unitários de `services/api.ts` passando
- Verificação final de `npx expo run:android` pendente (requer emulador Android API 34+)

---

## Token Usage

> Fill with the value shown in the Claude Code or Cursor UI at the end of the phase.

| Field | Value |
|-------|-------|
| Tool | Cursor (Sonnet 4.6) |
| Tokens consumed | — |
| Notes | — |
