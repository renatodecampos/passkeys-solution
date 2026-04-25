# Passkeys Solution

> Passwordless authentication with WebAuthn/FIDO2 — a full-stack proof of concept with an AI agent harness

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Coverage](https://img.shields.io/badge/coverage-100%25%20stmts-brightgreen)](#testing)

---

## Overview

This project implements a complete **passwordless authentication flow** using the [WebAuthn/FIDO2](https://webauthn.io/) standard. Users register and sign in using biometrics (fingerprint, Face ID) instead of passwords — no credentials to leak, no passwords to forget.

It is also a **structured engineering experiment**: the entire development was orchestrated by AI agents coordinated through a file-based harness — no shared conversation history, no manual state sync between tools. See the [Harness Presentation](docs/harness-presentation.md) for how it was done.

---

## Features

- **Registration** — creates a passkey tied to the user's device and biometrics
- **Authentication** — signs in with a biometric challenge, zero passwords
- **HTTPS locally** — self-signed certificate via `mkcert`; no paid cert required for development
- **Android support** — native passkey flow via `react-native-passkey` on API 34+ emulator
- **Demo UX (RFC-0002)** — Calm Card entry, keyboard-safe form, inline status messages, “Home Proof” screen summarizing server verification
- **100% statement coverage** on the server, 84% branch coverage (threshold: 80%)
- **Session security** — signed cookies, Helmet headers, CORS, rate limiting

---

## Architecture

```
passkeys-solution/
├── passkeys-server/        # Fastify API (TypeScript)
│   └── src/
│       ├── registration/   # getRegistrationOptions, verifyRegistration
│       ├── authentication/ # getAuthenticationOptions, verifyAuthentication
│       ├── infra/
│       │   ├── api/        # Fastify routes + security middleware
│       │   ├── database/   # MongoDB CRUD + Redis challenge storage
│       │   └── logger.ts
│       ├── setup/          # Environment config
│       └── types/
└── passkeys-app/           # Expo + React Native (Android)
    └── app/
        ├── index.tsx       # Public entry (register / sign in — RFC-0002 UX)
        ├── home.tsx        # Authenticated “Home Proof” (RFC-0002)
        ├── (tabs)/         # Extra routes (e.g. explore)
        └── _layout.tsx
```

App-specific setup and demo steps: [`passkeys-app/README.md`](passkeys-app/README.md).

**WebAuthn flow:**

```
Client                   Server                  Storage
  │                         │                       │
  │── registration request ─▶                       │
  │                         │── generate challenge ─▶ Redis (5 min TTL)
  │◀─ options + challenge ──│                       │
  │                         │                       │
  │── biometric prompt      │                       │
  │── signed credential ───▶│                       │
  │                         │── verify + store ─────▶ MongoDB
  │◀─ session cookie ───────│                       │
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API server | Fastify 5.x, TypeScript 5.8 |
| WebAuthn | `@simplewebauthn/server` 13.x |
| Persistence | MongoDB 6.x (credentials), Redis 7 (challenges) |
| Security | Helmet, CORS, rate limiting, signed cookies |
| Mobile app | Expo SDK 53, React Native 0.79, Expo Router 5 |
| Passkeys (native) | `react-native-passkey` 3.x |
| Tests | Jest 30 (server + app), `ts-jest` |
| Logging | Winston |
| Infrastructure | Docker Compose (MongoDB + Redis) |

---

## Prerequisites

- **Node.js** 20+
- **Docker** (MongoDB + Redis)
- **mkcert** — `brew install mkcert`
- **Android Studio** with an API 34+ emulator (image "Google APIs", **not** "Google Play")
- **ADB** in PATH

---

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/renatodecampos/passkeys-solution.git
cd passkeys-solution

cd passkeys-server && npm install && cd ..
cd passkeys-app && npm install && cd ..
```

### 2. Generate HTTPS certificates

```bash
mkcert -install          # installs the CA system-wide (requires sudo — run manually)
cd passkeys-server/certs
mkcert localhost 127.0.0.1 ::1
# generates: localhost+2.pem and localhost+2-key.pem
```

### 3. Configure environment variables

```bash
cp passkeys-server/.env-example passkeys-server/.env
# Edit .env and fill in all required variables (see table below)
```

| Variable | Purpose |
|---|---|
| `RP_ID` | WebAuthn Relying Party ID (e.g. `localhost`) |
| `RP_NAME` | Human-readable app name |
| `RP_ORIGIN` | Full origin (e.g. `https://localhost:3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `DB_NAME` | Database name |
| `COLLECTION_NAME` | Users collection name |
| `REDIS_URL` | Redis URL (e.g. `redis://localhost:6379`) |
| `SESSION_SECRET` | Secret for signed cookies |
| `ANDROID_CERT_FINGERPRINT` | SHA-256 of the Android debug keystore |
| `ANDROID_ORIGIN` | Android WebAuthn origin (`android:apk-key-hash:<base64>`) |

To get `ANDROID_CERT_FINGERPRINT`:

```bash
keytool -list -v \
  -keystore passkeys-app/android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
# Copy the SHA256 value: AA:BB:CC:...
```

### 4. Start infrastructure

```bash
docker-compose up -d     # MongoDB 7 (27017) + Redis 7 (6379)
```

---

## Running

### Server

```bash
cd passkeys-server
npm run dev
# Verify: curl -k https://localhost:3000/health → {"status":"ok"}
```

### Android app

```bash
# Port-forward so the emulator can reach https://localhost:3000
# Re-run every time the emulator restarts
adb reverse tcp:3000 tcp:3000

cd passkeys-app
npx expo run:android
```

#### One-time emulator setup

**Install the mkcert CA:**

```bash
adb push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/rootCA.pem
```

In the emulator: Settings → Security → Install from storage → `rootCA.pem` → install as "CA certificate".

**Add a virtual fingerprint:**

Settings → Security → Fingerprint → add a virtual fingerprint.

---

## Testing

```bash
# Server — Jest with coverage (threshold: 80%)
cd passkeys-server && npm test

# App — Jest (services/api.ts)
cd passkeys-app && npm test
```

Coverage results (server):

| Metric | Result |
|---|---|
| Statements | **100%** |
| Functions | **100%** |
| Lines | **100%** |
| Branches | 84% |

---

## Agent Harness

This project was built entirely by AI agents coordinated through a **file-based harness** — persistent state across tools, parallel sub-agent execution, and zero conversation history dependency.

- [`AGENTS.md`](AGENTS.md) — architecture rules and agent conventions
- [`CLAUDE.md`](CLAUDE.md) — onboarding for any new agent (or developer)
- [`rfcs/completed/RFC-0001`](rfcs/completed/RFC-0001-passkeys-poc-completion.md) — base PoC specification
- [`rfcs/completed/RFC-0002`](rfcs/completed/RFC-0002-ux-passkeys-poc.md) — Android UX evolution (concluída)
- [`tasks/`](tasks/README.md) — phase execution status

**[Read the full presentation →](docs/harness-presentation.md)**

---

## Project Status

**RFC-0001** (base PoC)

| Phase | Description | Status |
|---|---|---|
| Phase 1 | HTTPS server + infrastructure | ✅ completed |
| Phase 1b | Server unit tests | ✅ completed |
| Phase 2 | Android app + passkey flow | ✅ completed |
| Phase 3 | E2E integration + emulator certs | ✅ completed |
| Phase 4 | Documentation | ✅ completed |

**RFC-0002** (Android UX)

| Phase | Description | Status |
|---|---|---|
| 1 | UX do app (Calm Card, Home Proof) | ✅ completed |
| 2 | Validação UX e E2E | ✅ completed |
| 3 | Documentação + RFC em `rfcs/completed/` | ✅ completed |

---

## License

ISC
