# Fase 4 — Documentação

**Status da fase**: `[x] completed`
**Agente responsável**: Cursor Agent (Sonnet 4.6)
**Iniciado em**: 2026-04-24T16:00:00Z
**Concluído em**: 2026-04-24T16:30:00Z

---

## Pré-requisito

Fase 3 deve estar `[x] completed`.

---

## Critério de conclusão

`CLAUDE.md` reflete o estado real do projeto — um novo desenvolvedor consegue subir
o ambiente completo (server + emulador + app) seguindo apenas esse arquivo, sem consultar
outros documentos.

---

## Escopo

Documentar **apenas o que não é óbvio lendo o código ou os arquivos de configuração**.
Não documentar convenções genéricas, boas práticas ou o que já está na RFC.

O que entra:
- Comandos de setup que precisam ser executados manualmente (mkcert, adb, emulador)
- Decisões não óbvias tomadas durante as fases (ex: flag renomeada no Jest v29)
- Pré-requisitos de ambiente que não estão no `package.json`
- Ordem de inicialização dos serviços

O que não entra:
- Listar todos os endpoints da API (já está no README do server)
- Repetir o que já está em `AGENTS.md`
- Documentar o que o código expressa claramente

---

## Subtarefas

### 4.1 — Revisar o que mudou em cada fase
- **Status**: `[x] completed`
- **depends_on**: []
- **O que fazer**: Leia os campos `## Notas` de cada arquivo de status:
  - `tasks/rfc-0001/fase-1-status.md`
  - `tasks/rfc-0001/fase-1b-testes-server.md`
  - `tasks/rfc-0001/fase-2-status.md`
  - `tasks/rfc-0001/fase-3-status.md`
  Liste o que é relevante documentar no campo Notas deste arquivo antes de avançar.
- **Verificação**: Campo Notas preenchido com a lista de itens a documentar

### 4.2 — Atualizar CLAUDE.md
- **Status**: `[x] completed`
- **depends_on**: [4.1]
- **Arquivo**: `CLAUDE.md`
- **O que fazer**: Adicionar ou atualizar as seções abaixo com base no que foi levantado em 4.1:

  **Setup do ambiente (novo dev)**
  - Pré-requisitos: Node, Docker, mkcert, Android Studio + emulador API 34+
  - Gerar certificados: `cd passkeys-server/certs && mkcert localhost 127.0.0.1 ::1`
    (rootCA em `/Users/renatodecampos/Library/Application Support/mkcert`)
  - Iniciar infra: `docker-compose up -d`

  **Iniciar o server**
  - Sempre HTTPS: `cd passkeys-server && npm run dev`
  - Verificação: `curl -k https://localhost:3000/health`

  **Iniciar o app no emulador**
  - Port forwarding (reexecutar se o emulador reiniciar): `adb reverse tcp:3000 tcp:3000`
  - Build e install: `cd passkeys-app && npx expo run:android`

  **Testes**
  - Server: `cd passkeys-server && npm test`
  - Server (watch): `npm run test:watch`
  - App: `cd passkeys-app && npm test`
  - Nota: Jest v29 usa `--testPathPatterns` (plural) — flag renomeada

  **Emulador — configuração única (feita uma vez)**
  - Instalar CA do mkcert: `adb push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/rootCA.pem`
    → Settings → Security → Install from storage → rootCA.pem
  - Configurar biometria virtual: Settings → Security → Fingerprint

- **Verificação**: `CLAUDE.md` atualizado sem duplicar informações já presentes

### 4.3 — Atualizar README do server
- **Status**: `[x] completed`
- **depends_on**: [4.1]
- **Arquivo**: `passkeys-server/README.md`
- **O que fazer**: Atualizar apenas as seções que ficaram desatualizadas:
  - Seção "Prerequisites": adicionar mkcert
  - Seção "Installation": adicionar passo de geração de certificados
  - Seção "Environment Variables": corrigir nomes das variáveis para refletir `setup/index.ts`
    (`REDIS_URL` em vez de `REDIS_HOST`/`REDIS_PORT`, `DB_NAME` em vez de `MONGODB_DATABASE`)
  - Remover menção a `npm test` como placeholder — agora funciona
- **Verificação**: README não menciona variáveis que não existem em `setup/index.ts`

### 4.5 — Gerar token-report.md
- **Status**: `[x] completed`
- **depends_on**: [4.1]
- **Arquivo**: `tasks/rfc-0001/token-report.md` (criar)
- **O que fazer**:
  1. Leia a seção `## Token Usage` de cada arquivo de status:
     - `tasks/rfc-0001/fase-1-status.md`
     - `tasks/rfc-0001/fase-1b-testes-server.md`
     - `tasks/rfc-0001/fase-2-status.md`
     - `tasks/rfc-0001/fase-3-status.md`
     - `tasks/rfc-0001/fase-4-documentacao.md` (preencha o valor desta fase antes de gerar)
  2. Crie `tasks/rfc-0001/token-report.md` com a tabela consolidada abaixo
  3. Se algum campo `Tokens consumidos` estiver como `—`, registre como `não informado`

- **Formato do relatório**:
  ```markdown
  # Token Report — RFC-0001

  **Gerado em**: YYYY-MM-DD
  **Ferramenta principal**: Cursor (Sonnet 4.6)

  | Fase | Descrição                  | Tokens consumidos |
  |------|----------------------------|-------------------|
  | 1    | Infra + HTTPS              | X                 |
  | 1b   | Testes unitários server    | X                 |
  | 2    | App Android                | X                 |
  | 3    | E2E no emulador            | X                 |
  | 4    | Documentação               | X                 |
  |      | **Total**                  | **X**             |

  ## Observações
  - ...
  ```
- **Verificação**: arquivo `tasks/rfc-0001/token-report.md` criado com todas as fases preenchidas

### 4.4 — Atualizar RFC para IN_PROGRESS → COMPLETED
- **Status**: `[x] completed`
- **depends_on**: [4.2, 4.3]
- **Arquivo**: `rfcs/draft/RFC-0001-passkeys-poc-completion.md`
- **O que fazer**:
  - Mover o arquivo para `rfcs/completed/`
  - Atualizar `status: COMPLETED`
  - Atualizar `decision_date` com a data atual
  - Preencher `## Decision Record` com: decisão tomada, data, principais pontos (ex: mkcert + adb reverse funcionou conforme esperado, `react-native-passkey` compatível com Expo SDK 53)
- **Verificação**: Arquivo em `rfcs/completed/`, status `COMPLETED`

---

## Parallelism map

```
4.1 → 4.2 ─┐
4.1 → 4.3 ─┤→ 4.4
4.1 → 4.5 ─┘
```

4.2, 4.3 e 4.5 podem rodar em paralelo após 4.1.

---

## Instruções para o Orquestrador

> Estas instruções são lidas automaticamente quando você executa `/feature-dev execute RFC-0001 fase 4`

**Pré-condição**: verifique que `tasks/rfc-0001/fase-3-status.md` está `[x] completed`. Se não estiver, pare e informe.

**Ao iniciar**: atualize o cabeçalho deste arquivo — `Status da fase` para `[~] in_progress`, `Agente responsável` com seu nome, `Iniciado em` com timestamp ISO.

### BATCH A — sequencial
Execute **4.1**:
- Leia o campo `## Notas` de cada arquivo de status das fases anteriores
- Consolide no campo Notas deste arquivo o que é relevante documentar
- Marque 4.1 `[x] completed`

### BATCH B — paralelo
Dispare três sub-agentes **simultaneamente**:

**Sub-agente 1 — CLAUDE.md**
- Leia `CLAUDE.md` atual na íntegra
- Atualize conforme spec da subtarefa 4.2
- Não duplique informações já presentes
- Marque 4.2 `[x] completed`

**Sub-agente 2 — README do server**
- Leia `passkeys-server/README.md` atual na íntegra
- Leia `passkeys-server/src/setup/index.ts` para confirmar nomes das variáveis
- Atualize conforme spec da subtarefa 4.3
- Marque 4.3 `[x] completed`

**Sub-agente 3 — token-report.md**
- Leia a seção `## Token Usage` de cada arquivo de status das fases 1, 1b, 2, 3 e 4
- Preencha o valor da fase 4 neste arquivo antes de consolidar
- Crie `tasks/rfc-0001/token-report.md` conforme spec da subtarefa 4.5
- Marque 4.5 `[x] completed`

**Aguarde os três** antes de avançar.

### BATCH C — sequencial
Execute **4.4**:
- Crie o diretório `rfcs/completed/` se não existir
- Mova `rfcs/draft/RFC-0001-passkeys-poc-completion.md` para `rfcs/completed/`
- Atualize status e preencha Decision Record
- Marque 4.4 `[x] completed`

### Finalização
- Todos completos → atualize `Status da fase` para `[x] completed` com `Concluído em`
- Algum bloqueio → atualize `Status da fase` para `[!] blocked` e registre em Blockers

---

## Blockers

_Nenhum bloqueio registrado._

---

## Notas

### Itens relevantes para documentar (levantados em 4.1)

**Setup / ambiente (fase 1)**
- Certificados gerados com nome `localhost+2.pem` / `localhost+2-key.pem` em `passkeys-server/certs/`
- `mkcert -install` requer sudo interativo — deve ser executado manualmente pelo usuário antes de instalar a CA no emulador
- CA rootCA em: `/Users/renatodecampos/Library/Application Support/mkcert`
- Variáveis de ambiente antigas (`REDIS_HOST`, `REDIS_PORT`, `MONGODB_DATABASE`) foram substituídas por `REDIS_URL`, `DB_NAME` e `COLLECTION_NAME` para alinhar com `setup/index.ts`
- `RP_ORIGIN` deve ser `https://localhost:3000` (não `http://localhost:3001`)

**Testes (fase 1b)**
- Jest v29 usa `--testPathPatterns` (plural) — flag renomeada vs versões anteriores
- `ts-node` é devDependency necessária para `jest.config.ts` em TypeScript

**App Android (fase 2)**
- `react-native-passkey` v3.3.3 compatível com Expo SDK 53 / RN 0.79
- Após instalar dependência nativa: `npx expo prebuild --platform android --clean`

**Integração E2E (fase 3)**
- Debug keystore está em `passkeys-app/android/app/debug.keystore` (não em `~/.android/debug.keystore`)
- SHA256 atual do debug keystore: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
- `adb reverse tcp:3000 tcp:3000` precisa ser reexecutado toda vez que o emulador reiniciar
- Tela home movida para `app/home.tsx` para resolver ambiguidade de rota com `app/(tabs)/index.tsx`
- `ANDROID_ORIGIN=android:apk-key-hash:...` deve constar no `.env` (além de `RP_ORIGIN`)
- `generate-authentication-options` exige body `{}` explícito (não `undefined`)
