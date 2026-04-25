# Fase 1 — Infraestrutura e HTTPS no Server

**Status da fase**: `[x] completed`
**Agente responsável**: Cursor Agent (Sonnet 4.6)
**Iniciado em**: 2026-04-24T00:00:00Z
**Concluído em**: 2026-04-24T09:48:06Z

---

## Critério de conclusão

```bash
curl -k https://localhost:3000/health
# resposta esperada: {"status":"ok"}
```

A fase só está completa quando este comando retorna a resposta esperada com o server rodando via HTTPS.

---

## Subtarefas

### 1.1 — docker-compose.yml
- **Status**: `[x] completed`
- **depends_on**: []
- **Arquivo**: `docker-compose.yml` (raiz do projeto)
- **O que fazer**: Criar docker-compose com serviços `mongodb:7` (porta 27017) e `redis:7-alpine` (porta 6379), com volume persistente para o MongoDB
- **Verificação**: `docker-compose up -d && docker ps` mostra ambos os containers rodando

### 1.2 — Gerar certificados mkcert
- **Status**: `[x] completed`
- **depends_on**: []
- **Arquivo**: `passkeys-server/certs/` (criar diretório, adicionar ao .gitignore)
- **O que fazer**:
  1. Verificar se mkcert está instalado (`brew install mkcert` se não estiver)
  2. `mkcert -install` para instalar a CA local no sistema
  3. `cd passkeys-server/certs && mkcert localhost 127.0.0.1 ::1`
  4. Documentar o caminho da rootCA do mkcert: `mkcert -CAROOT`
- **Verificação**: Arquivos `localhost+2.pem` e `localhost+2-key.pem` existem em `passkeys-server/certs/`
- **Nota**: O nome dos arquivos gerados pode variar com o número de SANs. Verificar nome real após geração.

### 1.3 — Fastify com HTTPS
- **Status**: `[x] completed`
- **depends_on**: [1.2]
- **Arquivo**: `passkeys-server/src/index.ts`
- **O que fazer**: Modificar para carregar os arquivos `.pem` de `../certs/` e passar `https: { key, cert }` para o Fastify
- **Verificação**: Servidor inicia sem erro e loga `Server Passkeys POC is running on port 3000`

### 1.4 — Atualizar segurança e adicionar endpoint AASA
- **Status**: `[x] completed`
- **depends_on**: [1.3]
- **Arquivo**: `passkeys-server/src/infra/api/index.ts`
- **O que fazer**:
  1. `cookie.secure: true` (remover condicional de ambiente — server é sempre HTTPS agora)
  2. Adicionar `GET /.well-known/apple-app-site-association` (não será testado, mas completa a spec)
- **Verificação**: `curl -k https://localhost:3000/health` retorna 200

### 1.5 — Configurar .env
- **Status**: `[x] completed`
- **depends_on**: []
- **Arquivo**: `passkeys-server/.env` (criar a partir de `.env-example` se não existir)
- **O que fazer**: Garantir que o `.env` contenha:
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
- **Verificação**: `npm run dev` no server não loga erros de variável ausente

### 1.6 — Adicionar certs/ ao .gitignore
- **Status**: `[x] completed`
- **depends_on**: [1.2]
- **Arquivo**: `passkeys-server/.gitignore`
- **O que fazer**: Adicionar linha `certs/` ao .gitignore do server
- **Verificação**: `git status` não mostra os arquivos `.pem` como untracked

---

## Parallelism map

```
1.1 ──────────────────────────────────────── pode rodar em paralelo com 1.2 e 1.5
1.2 → 1.3 → 1.4
1.2 → 1.6
1.5 ──── (independente, mas necessária antes do critério de conclusão)
```

Subtarefas 1.1, 1.2 e 1.5 podem ser iniciadas simultaneamente.

---

## Blockers

_Nenhum bloqueio registrado._

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

> Preencha com o valor exibido na UI do Claude Code ou Cursor ao final da fase.

| Campo | Valor |
|-------|-------|
| Ferramenta | Cursor (Sonnet 4.6) |
| Tokens consumidos | — |
| Observação | — |
