# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A passkeys (WebAuthn/FIDO2) passwordless authentication system with two components:

- **passkeys-server**: TypeScript/Fastify backend
- **passkeys-app**: Expo/React Native cross-platform frontend

## Environment setup (new developer)

### Prerequisites

- Node.js 20+
- Docker (for MongoDB and Redis)
- [mkcert](https://github.com/FiloSottile/mkcert) — `brew install mkcert`
- Android Studio with API 34+ emulator (image **"Google APIs"**, not **"Google Play"**)

### Generate HTTPS certificates

```bash
mkcert -install          # installs the CA on the system (requires sudo — run manually)
cd passkeys-server/certs
mkcert localhost 127.0.0.1 ::1
# creates: localhost+2.pem and localhost+2-key.pem
```

The root CA lives at `/Users/<you>/Library/Application Support/mkcert`.

### Start infrastructure

```bash
docker-compose up -d     # MongoDB 7 (27017) + Redis 7 (6379)
```

### Start the server

The server always runs over **HTTPS**.

```bash
cd passkeys-server
npm run dev
# check: curl -k https://localhost:3000/health → {"status":"ok"}
```

### Port forwarding for the emulator

Required so the Android app can reach `https://localhost:3000`.  
**Run again whenever the emulator restarts.**

```bash
adb reverse tcp:3000 tcp:3000
```

### Build and install the app on the emulator

```bash
cd passkeys-app
npx expo run:android
```

### One-time emulator setup

**Install the mkcert CA:**

```bash
adb push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/rootCA.pem
```

On the emulator: Settings → Security → Install from storage → `rootCA.pem` → install as "CA certificate".

**Virtual biometrics:**  
Settings → Security → Fingerprint → add a virtual fingerprint.

---

## Commands

### passkeys-server

```bash
cd passkeys-server
npm run dev      # Development server with hot-reload (ts-node + nodemon)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled server
npm test         # Jest (coverage ≥ 80%)
npm run test:watch
```

### passkeys-app

```bash
cd passkeys-app
npx expo run:android   # Build and install on emulator/device (expo-dev-client, not Expo Go)
npm start              # Expo dev server (no native build)
npm run lint           # ESLint (app package.json script invokes the binary in node_modules)
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

**WebAuthn flow:** Client request → Fastify route → registration/authentication module → MongoDB (user/credential persistence) + Redis (temporary challenge storage)

### App (`passkeys-app/app/`)

File-based routing via Expo Router (similar to Next.js):

- `_layout.tsx` — root Stack + Theme layout
- `index.tsx` — public entry (Calm Card, register/sign in with passkey — RFC-0002)
- `home.tsx` — authenticated screen (Home Proof: short server verification)
- `(tabs)/` — tab group (e.g. explore); passkey flow uses `/` and `/home`
- Path alias `@/`* maps to project root

## Environment variables

Copy `.env-example` in `passkeys-server/` before running the server. Required variables:


| Variable                                    | Purpose                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `RP_ID`, `RP_NAME`, `RP_ORIGIN`             | WebAuthn relying party config (`RP_ORIGIN=https://localhost:3000`) |
| `MONGODB_URI`, `DB_NAME`, `COLLECTION_NAME` | MongoDB connection                                                 |
| `REDIS_URL`                                 | Full Redis URL (e.g. `redis://localhost:6379`)                     |
| `SESSION_SECRET`                            | Secure cookie signing                                              |
| `ANDROID_CERT_FINGERPRINT`                  | SHA-256 of the Android debug keystore                              |
| `ANDROID_ORIGIN`                            | Android WebAuthn origin (e.g. `android:apk-key-hash:<base64>`)     |
| `AUTH_DENY_ON_BINDING_LOST`                 | `true` blocks sign-in when Keystore binding lost (RFC-0004 PoC)   |
| `AUTH_ATTEMPTS_COLLECTION`                  | MongoDB collection for per-attempt audit log (default `auth_attempts`) |
| `KEYSTORE_BINDING_COLLECTION`               | MongoDB collection for binding public keys (default `keystore_binding`) |
| `BINDING_CHALLENGE_TTL_SECONDS`             | TTL for binding challenge in Redis (default `300`)                 |


To obtain `ANDROID_CERT_FINGERPRINT`:

```bash
keytool -list -v \
  -keystore passkeys-app/android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
# Copy the SHA-256 value: AA:BB:CC:...
```

## Keystore binding PoC (RFC-0004)

Android-only feature that detects biometric enrollment changes using an app-managed Keystore key.
Full design in `rfcs/completed/RFC-0004-android-keystore-auth-audit-biometry-signal.md`.

### MongoDB collections

| Collection | Purpose | Schema version |
|---|---|---|
| `auth_attempts` | One row per authentication attempt (success + failure). Fields: `userId`, `createdAt`, `result`, `bindingOutcome`, `suspiciousActivity`, `bindingUnlockHint`. | `schemaVersion: 1` |
| `keystore_binding` | Binding public key registered after passkey creation. Fields: `userId`, `publicKeySpkiB64`, `algorithm`, `createdAt`. Unique index on `userId`. | `schemaVersion: 1` |

### Manual PoC checklist

**Healthy scenario** (`binding=ok`):

1. Start server with `AUTH_DENY_ON_BINDING_LOST=true` in `.env`
2. Register a passkey (one fingerprint enrolled on device)
3. Sign in → backend logs `binding=ok suspicious=false` → home screen shows `ok — keystore intact` in green

**Suspicious scenario** (`binding=lost`):

1. After registering, go to Settings → Biometrics → add a second fingerprint
2. Sign in → backend logs `binding=lost suspicious=true verified=false`
3. App shows: *"Access blocked: a new biometric was registered on this device since enrollment."*

### PoC limitations

- `binding_lost` ≠ proof of attacker. A legitimate user adding their own second fingerprint triggers the same outcome.
- The binding key is unlocked by strong biometrics (`BIOMETRIC_STRONG`). Device PIN fallback is disabled in this PoC.
- Evidence gathered on emulator may not generalize to all OEM/API combinations (see RFC Decision Record).
- `auth_attempts` can accumulate noise from failed attempts and tests; high row count alone is not a security signal.
- No automated TTL on `auth_attempts` — for local research MongoDB only. Define retention policy before production use.

## Tests

```bash
# Server (Jest v29 — use --testPathPatterns with a plural “s”)
cd passkeys-server && npm test
cd passkeys-server && npm run test:watch

# App
cd passkeys-app && npm test
```

> **App setup dependency:** `jest.config.ts` uses TypeScript. For Jest to run it, `ts-node` must be installed as a devDependency in `passkeys-app`:
>
> ```bash
> cd passkeys-app && npm install --save-dev ts-node
> ```

## Agent harness

This project uses agent-assisted execution with state tracked in files:

- `AGENTS.md` — architecture rules and conventions all agents must follow
- `tasks/rfc-0001/fase-1-status.md` — server infrastructure and HTTPS
- `tasks/rfc-0001/fase-1b-testes-server.md` — server unit tests
- `tasks/rfc-0001/fase-2-status.md` — Android app (prebuild, passkeys, screens)
- `tasks/rfc-0001/fase-3-status.md` — integration, emulator certificates, E2E tests
- `tasks/rfc-0002/fase-1-ux-app.md` — app UX (RFC-0002)
- `tasks/rfc-0002/fase-2-ux-validacao.md` — UX/E2E validation (RFC-0002)
- `tasks/rfc-0002/fase-3-documentacao.md` — final documentation (RFC-0002)
- `tasks/rfc-0003/fase-1-assets.md` — visual identity: branded PNGs (RFC-0003)
- `tasks/rfc-0003/fase-2-appjson.md` — `app.json` Light Clean + splash (RFC-0003)
- `tasks/rfc-0003/fase-3-validacao.md` — device / prebuild validation (RFC-0003)
- `tasks/rfc-0003/fase-4-documentacao.md` — RFC-0003 documentation close-out
- `tasks/rfc-0004/fase-1-server-audit-binding.md` — server: auth_attempts, keystore_binding, binding verify (RFC-0004)
- `tasks/rfc-0004/fase-2-android-keystore.md` — Android Keystore native module + client payload (RFC-0004)
- `tasks/rfc-0004/fase-3-documentacao.md` — RFC-0004 documentation close-out
- `rfcs/completed/RFC-0001-passkeys-poc-completion.md` — base plan
- `rfcs/completed/RFC-0002-ux-passkeys-poc.md` — UX evolution (completed)
- `rfcs/completed/RFC-0003-visual-identity.md` — app icon, splash, Light Clean (completed)
- `rfcs/completed/RFC-0004-android-keystore-auth-audit-biometry-signal.md` — Keystore binding PoC (completed)

Phases are sequential. Within a phase, subtasks with no dependency may run in parallel.  
See `tasks/README.md` for the status legend.

## Key dependencies

**Server:** Fastify 5.x, `@simplewebauthn/server` 13.x, MongoDB 6.x, ioredis 5.x, Winston  
**App:** Expo SDK 53, React 19, React Native 0.79, Expo Router 5