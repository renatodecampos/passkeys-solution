# Phase 1 — Server infrastructure and HTTPS

**Phase status**: `[x] completed`
**Owning agent**: Cursor Agent (Sonnet 4.6)
**Started at**: 2026-04-24T00:00:00Z
**Completed at**: 2026-04-24T09:48:06Z

---

## Completion criterion

```bash
curl -k https://localhost:3000/health
# expected response: {"status":"ok"}
```

The phase is complete only when this command returns the expected response with the server running over HTTPS.

---

## Subtasks

### 1.1 — docker-compose.yml
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `docker-compose.yml` (project root)
- **What to do**: Criar docker-compose com serviços `mongodb:7` (porta 27017) e `redis:7-alpine` (porta 6379), com volume persistente para o MongoDB
- **Verification**: `docker-compose up -d && docker ps` mostra ambos os containers rodando

### 1.2 — Gerar certificados mkcert
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-server/certs/` (criar diretório, adicionar ao .gitignore)
- **What to do**:
  1. Verificar se mkcert está instalado (`brew install mkcert` se não estiver)
  2. `mkcert -install` para instalar a CA local no sistema
  3. `cd passkeys-server/certs && mkcert localhost 127.0.0.1 ::1`
  4. Documentar o caminho da rootCA do mkcert: `mkcert -CAROOT`
- **Verification**: Arquivos `localhost+2.pem` e `localhost+2-key.pem` existem em `passkeys-server/certs/`
- **Nota**: O nome dos arquivos gerados pode variar com o número de SANs. Verificar nome real após geração.

### 1.3 — Fastify com HTTPS
- **Status**: `[x] completed`
- **depends_on**: [1.2]
- **File**: `passkeys-server/src/index.ts`
- **What to do**: Modificar para carregar os arquivos `.pem` de `../certs/` e passar `https: { key, cert }` para o Fastify
- **Verification**: Servidor inicia sem erro e loga `Server Passkeys POC is running on port 3000`

### 1.4 — Atualizar segurança e adicionar endpoint AASA
- **Status**: `[x] completed`
- **depends_on**: [1.3]
- **File**: `passkeys-server/src/infra/api/index.ts`
- **What to do**:
  1. `cookie.secure: true` (remover condicional de ambiente — server é sempre HTTPS agora)
  2. Adicionar `GET /.well-known/apple-app-site-association` (não será testado, mas completa a spec)
- **Verification**: `curl -k https://localhost:3000/health` retorna 200

### 1.5 — Configurar .env
- **Status**: `[x] completed`
- **depends_on**: []
- **File**: `passkeys-server/.env` (criar a partir de `.env-example` se não existir)
- **What to do**: Garantir que o `.env` contenha:
  ```
  RP_ID=localhost
  RP_NAME=Passkeys POC
  RP_ORIGIN=https://localhost:3000
  PORT=3000
  HOST=0.0.0.0
  NODE_ENV=development
  LOG_LEVEL=debug
  ```
  Os valores de MONGODB_URI, REDIS_URL e SESSION_SECRET também devem estar presentes.
- **Verification**: `npm run dev` no server não loga erros de variável ausente

### 1.6 — Adicionar certs/ ao .gitignore
- **Status**: `[x] completed`
- **depends_on**: [1.2]
- **File**: `passkeys-server/.gitignore`
- **What to do**: Adicionar linha `certs/` ao .gitignore do server
- **Verification**: `git status` não mostra os arquivos `.pem` como untracked

---

## Parallelism map

```
1.1 ──────────────────────────────────────── can run in parallel with 1.2 and 1.5
1.2 → 1.3 → 1.4
1.2 → 1.6
1.5 ──── (independent, but required before the completion criterion)
```

Subtasks 1.1, 1.2, and 1.5 can start in parallel.

---

## Blockers

_No blockers recorded._

---

## Notas

- Certificados gerados: `localhost+2.pem` e `localhost+2-key.pem` em `passkeys-server/certs/`
- `mkcert -install` requer sudo interativo — precisa ser executado manualmente pelo usuário para que navegadores confiem no cert. Para o critério da fase (`curl -k`) não é necessário.
- CA rootCA em: `/Users/renatodecampos/Library/Application Support/mkcert`
- Variáveis `REDIS_HOST`/`REDIS_PORT` do .env antigo foram substituídas por `REDIS_URL` (alinhado com `setup/index.ts`)
- `MONGODB_DATABASE` do .env antigo substituído por `DB_NAME` + `COLLECTION_NAME` (alinhado com `setup/index.ts`)
- `RP_ORIGIN` atualizado de `http://localhost:3001` para `https://localhost:3000`
- Critério verificado: `curl -k https://localhost:3000/health` → `{"status":"ok"}`

---

## Token Usage

> Fill with the value shown in the Claude Code or Cursor UI at the end of the phase.

| Field | Value |
|-------|-------|
| Tool | Cursor (Sonnet 4.6) |
| Tokens consumed | — |
| Notes | — |
