# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A passkeys (WebAuthn/FIDO2) passwordless authentication system with two components:
- **passkeys-server**: TypeScript/Fastify backend
- **passkeys-app**: Expo/React Native cross-platform frontend

## Setup do ambiente (novo desenvolvedor)

### Pré-requisitos

- Node.js 20+
- Docker (para MongoDB e Redis)
- [mkcert](https://github.com/FiloSottile/mkcert) — `brew install mkcert`
- Android Studio com emulador API 34+ (imagem "Google APIs", **não** "Google Play")

### Gerar certificados HTTPS

```bash
mkcert -install          # instala a CA no sistema (requer senha sudo — execute manualmente)
cd passkeys-server/certs
mkcert localhost 127.0.0.1 ::1
# gera: localhost+2.pem e localhost+2-key.pem
```

A rootCA fica em `/Users/<you>/Library/Application Support/mkcert`.

### Iniciar infraestrutura

```bash
docker-compose up -d     # MongoDB 7 (27017) + Redis 7 (6379)
```

### Iniciar o server

O server roda **sempre via HTTPS**.

```bash
cd passkeys-server
npm run dev
# verificação: curl -k https://localhost:3000/health → {"status":"ok"}
```

### Port forwarding para o emulador

Necessário para o app Android acessar `https://localhost:3000`.  
**Reexecutar sempre que o emulador reiniciar.**

```bash
adb reverse tcp:3000 tcp:3000
```

### Build e install do app no emulador

```bash
cd passkeys-app
npx expo run:android
```

### Configuração única do emulador (feita uma vez)

**Instalar CA do mkcert:**
```bash
adb push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/rootCA.pem
```
No emulador: Settings → Security → Install from storage → `rootCA.pem` → instalar como "CA certificate".

**Configurar biometria virtual:**  
Settings → Security → Fingerprint → adicionar impressão digital virtual.

---

## Commands

### passkeys-server
```bash
cd passkeys-server
npm run dev      # Development server with hot-reload (ts-node + nodemon)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled server
npm test         # Jest (cobertura ≥ 80%)
npm run test:watch
```

### passkeys-app
```bash
cd passkeys-app
npx expo run:android   # Build e instala no emulador/device (usa expo-dev-client, não Expo Go)
npm start              # Expo dev server (sem build nativo)
npm run lint           # ESLint (script no package.json do app chama o binário em node_modules)
npm test               # Jest (services/api.ts)
```

## Architecture

### Server (`passkeys-server/src/`)

Layered architecture: API routes → Business logic → Infrastructure

```
index.ts                    # Entry: initializes Fastify, MongoDB, Redis
setup/index.ts              # Environment config loader
types/index.ts              # UserModel type
registration/index.ts       # getRegistrationOptions, verifyRegistration
authentication/index.ts     # getAuthenticationOptions, verifyAuthentication
infra/api/index.ts          # Fastify routes, security middleware (Helmet, CORS, rate limiting)
infra/database/database.ts  # MongoDB CRUD operations
infra/database/redis.ts     # Redis client (challenge storage with 5-min TTL)
infra/logger.ts             # Winston logger
```

**WebAuthn flow**: Client request → Fastify route → registration/authentication module → MongoDB (user/credential persistence) + Redis (challenge temp storage)

### App (`passkeys-app/app/`)

File-based routing via Expo Router (similar to Next.js):
- `_layout.tsx` — root Stack + Theme layout
- `index.tsx` — entrada pública (Calm Card, registro/login com passkey — RFC-0002)
- `home.tsx` — tela autenticada (Home Proof: verificação resumida do servidor)
- `(tabs)/` — grupo de tabs (ex.: explore); fluxo passkey usa `/` e `/home`
- Path alias `@/*` maps to project root

## Environment Variables

Copy `.env-example` in `passkeys-server/` before running the server. Required variables:

| Variable | Purpose |
|---|---|
| `RP_ID`, `RP_NAME`, `RP_ORIGIN` | WebAuthn relying party config (`RP_ORIGIN=https://localhost:3000`) |
| `MONGODB_URI`, `DB_NAME`, `COLLECTION_NAME` | MongoDB connection |
| `REDIS_URL` | Redis URL completa (ex: `redis://localhost:6379`) |
| `SESSION_SECRET` | Secure cookie signing |
| `ANDROID_CERT_FINGERPRINT` | SHA256 do debug keystore Android |
| `ANDROID_ORIGIN` | Origin Android para WebAuthn (ex: `android:apk-key-hash:<base64>`) |

Para obter `ANDROID_CERT_FINGERPRINT`:
```bash
keytool -list -v \
  -keystore passkeys-app/android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
# Copiar o valor SHA256: AA:BB:CC:...
```

## Testes

```bash
# Server (Jest v29 — flag --testPathPatterns com "s" no plural)
cd passkeys-server && npm test
cd passkeys-server && npm run test:watch

# App
cd passkeys-app && npm test
```

> **Dependência de setup do app**: o arquivo `jest.config.ts` usa sintaxe TypeScript. Para que o Jest o execute, `ts-node` deve estar instalado como devDependency no `passkeys-app`:
> ```bash
> cd passkeys-app && npm install --save-dev ts-node
> ```

## Agent Harness

Este projeto usa execução assistida por agentes com rastreamento de estado em arquivos:

- `AGENTS.md` — regras de arquitetura e convenções que todos os agentes devem seguir
- `tasks/rfc-0001/fase-1-status.md` — Infraestrutura e HTTPS no server
- `tasks/rfc-0001/fase-1b-testes-server.md` — Testes unitários do server
- `tasks/rfc-0001/fase-2-status.md` — App Android (prebuild, passkeys, telas)
- `tasks/rfc-0001/fase-3-status.md` — Integração, certificados no emulador, testes E2E
- `tasks/rfc-0002/fase-1-ux-app.md` — UX do app (RFC-0002)
- `tasks/rfc-0002/fase-2-ux-validacao.md` — validação UX/E2E (RFC-0002)
- `tasks/rfc-0002/fase-3-documentacao.md` — documentação final (RFC-0002)
- `rfcs/completed/RFC-0001-passkeys-poc-completion.md` — plano base
- `rfcs/completed/RFC-0002-ux-passkeys-poc.md` — evolução UX (concluída)

Fases são sequenciais. Dentro de cada fase, subtarefas sem dependência podem rodar em paralelo.
Consulte `tasks/README.md` para a legenda de status.

## Key Dependencies

**Server**: Fastify 5.x, `@simplewebauthn/server` 13.x, MongoDB 6.x, ioredis 5.x, Winston  
**App**: Expo SDK 53, React 19, React Native 0.79, Expo Router 5
