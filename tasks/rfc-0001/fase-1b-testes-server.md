# Phase 1b — Server unit tests

**Phase status**: `[x] completed`
**Owning agent**: Cursor Agent (Sonnet 4.6)
**Started at**: 2026-04-24T10:00:00Z
**Completed at**: 2026-04-24T10:20:00Z

---

## Prerequisite

Fase 1 deve estar `[x] completed`.

---

## Completion criterion

```bash
cd passkeys-server && npm test
# todos os testes passam, cobertura ≥ 80% em registration/ e authentication/
```

---

## Contexto

O server tem dois módulos de lógica de negócio que valem cobertura unitária:

- `src/registration/index.ts` — `getRegistrationOptions`, `verifyRegistration`
- `src/authentication/index.ts` — `getAuthenticationOptions`, `verifyAuthentication`

Ambos têm dependências externas mockáveis: MongoDB (`infra/database/database`), Redis (`infra/database/redis`) e `@simplewebauthn/server`. Rotas e infraestrutura são cobertos pelo E2E da Fase 3.

---

## Subtasks

### 1b.1 — Setup de Jest + ts-jest
- **Status**: `[x] completed`
- **depends_on**: []
- **Arquivos**: `passkeys-server/package.json`, `passkeys-server/jest.config.ts`
- **What to do**:
  1. Instalar dependências:
     ```bash
     cd passkeys-server
     npm install --save-dev jest ts-jest @types/jest
     ```
  2. Criar `jest.config.ts`:
     ```typescript
     import type { Config } from 'jest';

     const config: Config = {
       preset: 'ts-jest',
       testEnvironment: 'node',
       roots: ['<rootDir>/src'],
       testMatch: ['**/__tests__/**/*.test.ts'],
       moduleNameMapper: {
         '^(\\.{1,2}/.*)\\.js$': '$1',
       },
       collectCoverageFrom: [
         'src/registration/**/*.ts',
         'src/authentication/**/*.ts',
       ],
       coverageThreshold: {
         global: {
           lines: 80,
           functions: 80,
         },
       },
     };

     export default config;
     ```
  3. Atualizar `scripts.test` no `package.json`:
     ```json
     "test": "jest --coverage",
     "test:watch": "jest --watch"
     ```
- **Verification**: `npm test` executa sem erro (zero testes ainda — só a infra)

### 1b.2 — Testes de registration
- **Status**: `[x] completed`
- **depends_on**: [1b.1]
- **File**: `passkeys-server/src/registration/__tests__/index.test.ts`
- **Mocks necessários**:
  - `../../infra/database/database` → `getUser`, `createUser`, `updateUser`
  - `../../infra/database/redis` → `redis.setex`, `redis.get`
  - `@simplewebauthn/server` → `generateRegistrationOptions`, `verifyRegistrationResponse`
  - `uuid` → `v4`

- **Casos de teste para `getRegistrationOptions`**:
  1. Usuário existente → retorna opções sem criar novo usuário
  2. Usuário inexistente → cria usuário via `createUser`, depois retorna opções
  3. Armazena o challenge no Redis com TTL de 300 segundos
  4. Exclui credenciais existentes de `excludeCredentials`

- **Casos de teste para `verifyRegistration`**:
  1. Usuário não encontrado → lança `Error('User not found')`
  2. Challenge expirado (Redis retorna null) → lança `Error('No challenge found or challenge expired')`
  3. Verificação bem-sucedida com credencial nova → adiciona à lista e chama `updateUser`
  4. Verificação bem-sucedida com credencial já existente → não duplica, não chama `updateUser`
  5. `verifyRegistrationResponse` lança exceção → relança o erro

- **Verification**: `npm test -- --testPathPattern=registration` — todos os casos passam

### 1b.3 — Testes de authentication
- **Status**: `[x] completed`
- **depends_on**: [1b.1]
- **File**: `passkeys-server/src/authentication/__tests__/index.test.ts`
- **Mocks necessários**:
  - `../../infra/database/database` → `getUser`, `updateUser`
  - `../../infra/database/redis` → `redis.setex`, `redis.get`
  - `@simplewebauthn/server` → `generateAuthenticationOptions`, `verifyAuthenticationResponse`

- **Casos de teste para `getAuthenticationOptions`**:
  1. Usuário não encontrado → lança `Error('User not found')`
  2. Usuário com credenciais → retorna opções com `allowCredentials` correto
  3. Armazena challenge no Redis com TTL de 300 segundos

- **Casos de teste para `verifyAuthentication`**:
  1. Usuário não encontrado → lança `Error('User not found')`
  2. Challenge expirado → lança `Error('No challenge found or challenge expired')`
  3. Credencial não registrada para o usuário → lança `Error('Authenticator is not registered with this site')`
  4. Verificação bem-sucedida → atualiza counter via `updateUser`
  5. `verifyAuthenticationResponse` lança exceção → relança o erro

- **Verification**: `npm test -- --testPathPattern=authentication` — todos os casos passam

### 1b.4 — Verificação de cobertura
- **Status**: `[x] completed`
- **depends_on**: [1b.2, 1b.3]
- **What to do**: `npm test -- --coverage`
- **Verification**: Relatório mostra ≥ 80% de cobertura de linhas e funções em `registration/` e `authentication/`

---

## Parallelism map

```
1b.1 → 1b.2 ─┐
              ├→ 1b.4
1b.1 → 1b.3 ─┘
```

1b.2 e 1b.3 podem rodar em paralelo após 1b.1 completo.

---

## Convenções de mock

Todos os mocks ficam dentro do arquivo de teste (sem pasta `__mocks__` global).
Use `jest.mock('caminho/relativo')` + `jest.mocked()` para tipagem.

Exemplo de estrutura:

```typescript
import { getRegistrationOptions } from '../index';
import { getUser, createUser, updateUser } from '../../infra/database/database';
import { redis } from '../../infra/database/redis';
import { generateRegistrationOptions } from '@simplewebauthn/server';

jest.mock('../../infra/database/database');
jest.mock('../../infra/database/redis', () => ({
  redis: { setex: jest.fn(), get: jest.fn() },
}));
jest.mock('@simplewebauthn/server');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

const mockGetUser = jest.mocked(getUser);
const mockCreateUser = jest.mocked(createUser);
// ...

describe('getRegistrationOptions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna opções para usuário existente sem criar novo', async () => {
    mockGetUser.mockResolvedValue({ id: '1', username: 'alice', credentials: [], displayName: 'Alice' });
    // ...
  });
});
```

---

## Orchestrator instructions

> These instructions apply when you run `/feature-dev execute RFC-0001 phase 1b`

**Precondition:** confirm `tasks/rfc-0001/fase-1-status.md` is `[x] completed`. If not, stop and report.

**On start:** update this file’s header — set **Phase status** to `[~] in_progress`, **Owning agent** to your name, **Started at** to an ISO timestamp.

### BATCH A — sequential
Execute **1b.1** (setup Jest):
- Instale `jest ts-jest @types/jest` como devDependencies no `passkeys-server`
- Crie `jest.config.ts` conforme spec da subtarefa
- Atualize `scripts.test` e adicione `scripts.test:watch` no `package.json`
- Verifique: `npm test` executa sem erro
- Mark 1b.1 `[x] completed` antes de avançar

### BATCH B — parallel
Dispare dois sub-agentes **simultaneamente**:

**Sub-agent 1 — registration**
- Leia `passkeys-server/src/registration/index.ts` na íntegra
- Crie `passkeys-server/src/registration/__tests__/index.test.ts`
- Implemente os 5+4 casos listados na subtarefa 1b.2 acima
- Use as convenções de mock desta fase (seção "Convenções de mock")
- Mark 1b.2 `[~] in_progress` ao começar, `[x] completed` ou `[!] blocked` ao terminar
- Verifique: `npm test -- --testPathPattern=registration` passa

**Sub-agent 2 — authentication**
- Leia `passkeys-server/src/authentication/index.ts` na íntegra
- Crie `passkeys-server/src/authentication/__tests__/index.test.ts`
- Implemente os 3+5 casos listados na subtarefa 1b.3 acima
- Use as convenções de mock desta fase (seção "Convenções de mock")
- Mark 1b.3 `[~] in_progress` ao começar, `[x] completed` ou `[!] blocked` ao terminar
- Verifique: `npm test -- --testPathPattern=authentication` passa

**Aguarde ambos concluírem** antes de avançar.

### BATCH C — sequential
Execute **1b.4** (cobertura):
- Rode `cd passkeys-server && npm test -- --coverage`
- Verifique cobertura ≥ 80% em linhas e funções para `registration/` e `authentication/`
- Mark 1b.4 `[x] completed` se passou, `[!] blocked` se abaixo do threshold

### Wrap-up
- All done → set **Phase status** to `[x] completed` with **Completed at**
- Any block → set **Phase status** to `[!] blocked` and record under Blockers

---

## Blockers

_No blockers recorded._

---

## Notas

- Cobertura final: 100% statements, 100% funções, 100% linhas em ambos os módulos
- Branches: 84.44% (registration: 80.76%, authentication: 89.47%) — acima do threshold de 80%
- Jest v29 usa `--testPathPatterns` em vez de `--testPathPattern` (flag renomeada)
- `console.error` no catch de `registration/index.ts` produz output no teste de exceção (comportamento esperado do código produção)

---

## Token Usage

> Fill with the value shown in the Claude Code or Cursor UI at the end of the phase.

| Field | Value |
|-------|-------|
| Tool | Cursor (Sonnet 4.6) |
| Tokens consumed | — |
| Notes | — |
