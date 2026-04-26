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

## Demo

![Demo — RFC-0004: Android Keystore binding: biometric enrollment audit](demos/demo-rfc-0004.gif)

---

## Features

- **Registration** — creates a passkey tied to the user's device and biometrics
- **Authentication** — signs in with a biometric challenge, zero passwords
- **HTTPS locally** — self-signed certificate via `mkcert`; no paid cert required for development
- **Android support** — native passkey flow via `react-native-passkey` on API 34+ emulator
- **Demo UX (RFC-0002)** — Calm Card entry, keyboard-safe form, inline status messages, “Home Proof” screen summarizing server verification
- **Keystore binding audit (RFC-0004)** — Android app-managed Keystore key detects biometric enrollment changes; per-attempt audit log in MongoDB; configurable policies (block on binding lost, PIN unlock, rate limiting)
- **100% statement coverage** on the server, 84% branch coverage (threshold: 80%)
- **Session security** — signed cookies, Helmet headers, CORS, rate limiting

---

## Android version requirements for account risk detection (RFC-0004)

This PoC places a hardware-backed key inside the phone and asks the device to sign a challenge on every sign-in. If the key can no longer be used — because a new fingerprint was enrolled since the key was created — the backend receives a `binding=lost` signal and can act on it (block access, require re-verification, etc.).

How reliable that signal is depends on the Android version:

| Android version | What you get |
|---|---|
| **7.0 (API 24)** — minimum to run the feature | The alarm exists: adding a new fingerprint invalidates the key and the backend receives the risk signal. Below this version the key is never invalidated and the feature is silent. |
| **9.0 (API 28)** | The key moves into a **dedicated security chip** (StrongBox) physically separated from the main processor, making key extraction significantly harder even with direct hardware access. Falls back automatically to the processor's own secure area (TEE) if the chip is absent. |
| **11 (API 30)** — complete guarantee | The key can **only** be unlocked by a strong fingerprint. Device PIN, pattern, and weak face unlock cannot substitute. Below this version an attacker who knows the PIN could bypass the biometric requirement and sign the challenge anyway, making the detection unreliable. |

**Plain-language summary:** the detection signal works from Android 7, but the full guarantee — where knowing the PIN is not enough to fake the proof — only exists from Android 11 onward. Any production policy that relies on this signal should target Android 11+ devices.

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
| `AUTH_DENY_ON_BINDING_LOST` | `true` blocks sign-in when Keystore binding is lost (RFC-0004) |
| `AUTH_DENY_ON_BINDING_PIN_UNLOCK` | `true` blocks sign-in when binding key was unlocked via PIN instead of biometric (RFC-0004) |
| `AUTH_RATE_LIMIT_MAX` | Max auth attempts per userId per 5-min window before 429 (default `3`) |
| `AUTH_ATTEMPTS_COLLECTION` | MongoDB collection for per-attempt audit log (default `auth_attempts`) |
| `KEYSTORE_BINDING_COLLECTION` | MongoDB collection for binding public keys (default `keystore_binding`) |
| `BINDING_CHALLENGE_TTL_SECONDS` | TTL for binding challenge in Redis (default `300`) |

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
- [`rfcs/completed/RFC-0002`](rfcs/completed/RFC-0002-ux-passkeys-poc.md) — Android UX evolution (completed)
- [`rfcs/completed/RFC-0003`](rfcs/completed/RFC-0003-visual-identity.md) — visual identity: app icon, splash, Light Clean theme (completed)
- [`rfcs/completed/RFC-0004`](rfcs/completed/RFC-0004-android-keystore-auth-audit-biometry-signal.md) — Android Keystore binding + biometric audit (completed)
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
| 1 | App UX (Calm Card, Home Proof) | ✅ completed |
| 2 | UX validation and E2E | ✅ completed |
| 3 | Documentation + RFC in `rfcs/completed/` | ✅ completed |

**RFC-0003** (Visual identity)

| Phase | Description | Status |
|---|---|---|
| 1 | Asset generation (icon, splash, adaptive) | ✅ completed |
| 2 | `app.json` configuration | ✅ completed |
| 3 | Device validation | ✅ completed |
| 4 | Documentation | ✅ completed |

**RFC-0004** (Android Keystore binding + biometric audit)

| Phase | Description | Status |
|---|---|---|
| 1 | Server: `auth_attempts` audit log + Keystore binding verify | ✅ completed |
| 2 | Android: native Keystore module + client payload | ✅ completed |
| 3 | Documentation + RFC in `rfcs/completed/` | ✅ completed |
| 4 | Hardening: rate limiting, `revokedAt` history, PIN block policy | ✅ completed |

---

## License

ISC
