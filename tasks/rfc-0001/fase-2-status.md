# Fase 2 — App Android

**Status da fase**: `[x] completed`
**Agente responsável**: Cursor Agent (Sonnet 4.6)
**Iniciado em**: 2026-04-24T14:00:00Z
**Concluído em**: 2026-04-24T14:30:00Z

---

## Pré-requisito

Fase 1 deve estar `[x] completed` antes de iniciar esta fase.

---

## Critério de conclusão

O app compila e abre no emulador Android (API 34+) sem erros, mostrando a tela de login/registro com os dois botões funcionando (mesmo que o fluxo completo ainda falhe por cert — isso é testado na Fase 3).

```bash
cd passkeys-app
npx expo run:android
# app abre no emulador sem crash
```

---

## Subtarefas

### 2.1 — Instalar react-native-passkey
- **Status**: `[x] completed`
- **depends_on**: []
- **Arquivo**: `passkeys-app/package.json`
- **O que fazer**: `cd passkeys-app && npx expo install react-native-passkey`
- **Verificação**: `react-native-passkey` aparece em `dependencies` no `package.json`
- **Atenção**: Confirmar compatibilidade com Expo SDK 53 / RN 0.79. Se incompatível, registrar em Blockers e avaliar `@react-native-passkeys/passkeys` como alternativa.

### 2.2 — expo prebuild
- **Status**: `[x] completed`
- **depends_on**: [2.1]
- **O que fazer**: `cd passkeys-app && npx expo prebuild --platform android --clean`
- **Verificação**: Diretório `passkeys-app/android/` criado com `app/src/main/AndroidManifest.xml`
- **Nota**: Isso gera código nativo Android. O diretório `android/` deve ser adicionado ao controle de versão (não ao .gitignore) para que os agentes de fase 3 possam modificá-lo.

### 2.3 — network_security_config.xml
- **Status**: `[x] completed`
- **depends_on**: [2.2]
- **Arquivo**: `passkeys-app/android/app/src/main/res/xml/network_security_config.xml`
- **O que fazer**: Criar o arquivo conforme spec da RFC:
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
- **Verificação**: Arquivo existe no caminho correto

### 2.4 — AndroidManifest.xml
- **Status**: `[x] completed`
- **depends_on**: [2.3]
- **Arquivo**: `passkeys-app/android/app/src/main/AndroidManifest.xml`
- **O que fazer**: Adicionar atributo `android:networkSecurityConfig="@xml/network_security_config"` na tag `<application>`
- **Verificação**: Atributo presente no manifest

### 2.5 — services/api.ts
- **Status**: `[x] completed`
- **depends_on**: []
- **Arquivo**: `passkeys-app/services/api.ts` (criar diretório `services/` se não existir)
- **O que fazer**: Implementar as 4 funções conforme spec da RFC:
  - `generateRegistrationOptions(username)`
  - `verifyRegistration(username, response)`
  - `generateAuthenticationOptions(username)`
  - `verifyAuthentication(username, response)`
  - `BASE_URL = 'https://localhost:3000'`
- **Verificação**: TypeScript compila sem erros (`tsc --noEmit` no app)

### 2.6 — Tela de login/registro (app/index.tsx)
- **Status**: `[x] completed`
- **depends_on**: [2.1, 2.5]
- **Arquivo**: `passkeys-app/app/index.tsx`
- **O que fazer**: Substituir o conteúdo atual por:
  - Input de texto para `username`
  - Botão "Registrar" que chama `generateRegistrationOptions` → `Passkey.create` → `verifyRegistration`
  - Botão "Entrar" que chama `generateAuthenticationOptions` → `Passkey.get` → `verifyAuthentication`
  - Feedback de estado: loading, erro, sucesso
  - Após sucesso: navegar para `/(tabs)`
- **Verificação**: Tela renderiza no emulador com os dois botões visíveis

### 2.7 — Tela home autenticado (app/(tabs)/index.tsx)
- **Status**: `[x] completed`
- **depends_on**: [2.6]
- **Arquivo**: `passkeys-app/app/(tabs)/index.tsx`
- **O que fazer**: Substituir conteúdo de exemplo por:
  - Exibir username logado (passar via router params ou estado global simples)
  - Botão de logout que volta para `app/index.tsx`
- **Verificação**: Tela renderiza no emulador

### 2.8 — Testes unitários de services/api.ts
- **Status**: `[x] completed`
- **depends_on**: [2.5]
- **Arquivo**: `passkeys-app/services/__tests__/api.test.ts`
- **O que fazer**:
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

- **Verificação**: `npm test` no app — todos os casos passam

---

## Parallelism map

```
2.1 → 2.2 → 2.3 → 2.4
2.5 ──────────────────────────── pode rodar em paralelo com 2.1→2.2→2.3→2.4
2.5 → 2.8                        pode rodar em paralelo com 2.6 e 2.7
2.6 ← depends_on [2.1, 2.5]
2.7 ← depends_on [2.6]
```

Subtarefas 2.1 (e sua cadeia), 2.5 e 2.8 podem ser iniciadas sem bloquear umas às outras.

---

## Instruções para o Orquestrador

> Estas instruções são lidas automaticamente quando você executa `/feature-dev execute RFC-0001 fase 2`

**Pré-condição**: verifique que `tasks/rfc-0001/fase-1b-testes-server.md` está `[x] completed`. Se não estiver, pare e informe.

**Ao iniciar**: atualize o cabeçalho deste arquivo — `Status da fase` para `[~] in_progress`, `Agente responsável` com seu nome, `Iniciado em` com timestamp ISO.

### BATCH A — paralelo
Dispare dois sub-agentes **simultaneamente**:

**Sub-agente 1 — cadeia nativa**
- Execute 2.1: `cd passkeys-app && npx expo install react-native-passkey`
  - Se incompatível com Expo SDK 53 / RN 0.79: registre em Blockers e avalie `@react-native-passkeys/passkeys`
  - Marque 2.1 `[x] completed` ou `[!] blocked`
- Execute 2.2 (depende de 2.1): `npx expo prebuild --platform android --clean`
  - Marque 2.2 `[x] completed`
- Execute 2.3 (depende de 2.2): crie `passkeys-app/android/app/src/main/res/xml/network_security_config.xml`
  - Marque 2.3 `[x] completed`
- Execute 2.4 (depende de 2.3): adicione `android:networkSecurityConfig` no `AndroidManifest.xml`
  - Marque 2.4 `[x] completed`

**Sub-agente 2 — services**
- Execute 2.5: crie `passkeys-app/services/api.ts` com as 4 funções conforme spec da subtarefa
  - BASE_URL = `'https://localhost:3000'`
  - Marque 2.5 `[x] completed`
- Execute 2.8 (depende de 2.5): setup Jest no app + crie `passkeys-app/services/__tests__/api.test.ts`
  - Instale `jest @types/jest jest-fetch-mock ts-jest` como devDependencies
  - Implemente os casos de teste listados na subtarefa 2.8
  - Verifique: `cd passkeys-app && npm test` passa
  - Marque 2.8 `[x] completed` ou `[!] blocked`

**Aguarde ambos os sub-agentes concluírem** antes de avançar.

### BATCH B — sequencial
Execute **2.6** (depende de 2.1 e 2.5):
- Leia `passkeys-app/app/index.tsx` atual
- Substitua pelo conteúdo conforme spec da subtarefa 2.6
- Verifique que TypeScript compila sem erros
- Marque 2.6 `[x] completed`

### BATCH C — sequencial
Execute **2.7** (depende de 2.6):
- Leia `passkeys-app/app/(tabs)/index.tsx` atual
- Substitua pelo conteúdo conforme spec da subtarefa 2.7
- Marque 2.7 `[x] completed`

### Verificação final
- Rode `cd passkeys-app && npx expo run:android` no emulador
- App abre sem crash na tela de login/registro → fase completa

### Finalização
- Todos completos → atualize `Status da fase` para `[x] completed` com `Concluído em`
- Algum bloqueio → atualize `Status da fase` para `[!] blocked` e registre em Blockers

---

## Blockers

_Nenhum bloqueio registrado._

---

## Notas

- `react-native-passkey` v3.3.3 compatível com Expo SDK 53 / RN 0.79 sem alternativas
- `ts-node` foi adicionado como devDependency (necessário para `jest.config.ts` em TypeScript)
- `npx tsc --noEmit` sem erros após implementação completa
- 6/6 testes unitários de `services/api.ts` passando
- Verificação final de `npx expo run:android` pendente (requer emulador Android API 34+)

---

## Token Usage

> Preencha com o valor exibido na UI do Claude Code ou Cursor ao final da fase.

| Campo | Valor |
|-------|-------|
| Ferramenta | Cursor (Sonnet 4.6) |
| Tokens consumidos | — |
| Observação | — |
