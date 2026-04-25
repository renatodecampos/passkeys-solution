---
rfc_id: RFC-0001
title: Passkeys PoC completion — local HTTPS + Android
status: COMPLETED
author: Renato de Campos
reviewers: []
created: 2026-04-24
last_updated: 2026-04-24
decision_date: 2026-04-24
---

# RFC-0001: Passkeys PoC completion — local HTTPS + Android

## Overview

This RFC specifies the technical plan to complete the passwordless WebAuthn/Passkeys proof of
concept (POC). The system already has a working Fastify backend with the 4 WebAuthn endpoints.
What remains is: (a) local HTTPS with a self-signed certificate, (b) passkey integration in the
Android app, and (c) mutual trust configuration between the Android emulator and the local server.

Scope is deliberately limited: server on a local machine (macOS), Android client on an emulator,
no cloud, no paid certificates.

## Background & Context

### Current project state

```
passkeys/
├── passkeys-server/        # Fastify + TypeScript backend — ~80% complete
│   └── src/
│       ├── registration/   # generateOptions + verifyRegistration ✓
│       ├── authentication/ # generateOptions + verifyAuthentication ✓
│       └── infra/api/      # 4 WebAuthn endpoints + assetlinks.json ✓
└── passkeys-app/           # Expo + React Native — ~5% complete (template)
    └── app/                # No passkey code yet
```

### Relevant WebAuthn constraints

- WebAuthn requires **HTTPS** for any origin that is not literal `localhost`
- `RP_ID` must be a registrable domain (not an IP)
- Android Credential Manager validates app↔server association via **Digital Asset Links**
  (`/.well-known/assetlinks.json`) — the endpoint already exists on the server
- The SHA-256 in Digital Asset Links references the **app keystore**, not the TLS certificate

### Glossary

| Term | Definition |
|------|------------|
| RP_ID | Relying Party ID — domain that "owns" passkey credentials |
| RP_ORIGIN | Full origin (scheme + host + port) where the app runs |
| mkcert | Tool that creates a local CA trusted by the OS |
| adb reverse | ADB command that port-forwards the emulator to the host |
| Digital Asset Links | JSON file associating an Android app with a web domain |
| Credential Manager | Android API (>=9) used to create/use passkeys |

## Problem statement

The app has no passkey authentication code. The server runs HTTP only. Without HTTPS, Android
Credential Manager rejects the WebAuthn flow. Without trust in the self-signed certificate, the
app rejects TLS. Without Digital Asset Links association, Android rejects passkey creation.

**If we do not address this:** the POC cannot run end-to-end in a realistic way.

## Goals & Non-Goals

### Goals

- Fastify server serving HTTPS with mkcert self-signed cert
- Android app able to register and authenticate with passkeys
- Android emulator trusting the server TLS cert
- Full flow testable: register → authenticate → visual feedback in the app
- Test structure that validates each layer independently

### Non-Goals

- Cloud or production deploy
- iOS support
- Physical Android device (emulator only)
- Paid or public-CA certificates
- Concurrent load / load tests

## Evaluation criteria

| Criterion | Weight | Description |
|----------|--------|-------------|
| Setup complexity | High | Fewer manual steps |
| WebAuthn compatibility | High | Valid RP_ID, correct HTTPS origin |
| TLS trust on Android | High | No cert errors on emulator |
| Maintainability | Medium | Easy to recreate on a new machine |
| Iteration speed | Medium | Fast reload/rebuild in development |

## Options analysis

### Option 1: `localhost` + `adb reverse` + mkcert

**Description:** Server listens on `localhost:3000` with HTTPS (mkcert cert for `localhost`).
`adb reverse tcp:3000 tcp:3000` makes the emulator see `localhost:3000` on the host.
`RP_ID=localhost`, `RP_ORIGIN=https://localhost:3000`.

**Pros:**
- `localhost` is a secure context for WebAuthn — no special rules
- `adb reverse` needs no DNS or IP setup
- mkcert issues certs for `localhost` naturally
- Reproducible on any machine

**Cons:**
- Emulator must be running before `adb reverse`
- `adb reverse` must be re-run if the emulator restarts
- Does not work on a physical device without adaptation

**Scoring:**
| Criterion | Score | Notes |
|----------|-------|-------|
| Setup complexity | High | 3 steps: mkcert + adb reverse + start server |
| WebAuthn compatibility | Full | localhost is a privileged origin |
| TLS trust on Android | Needs config | network_security_config.xml + mkcert CA on device |
| Maintainability | High | Documentable in a few lines |
| Iteration speed | High | Hot reload works as usual |

**Effort:** Low — ~2h setup.  
**Risk:** Low. Main risk is mkcert CA not installed on the emulator; mitigated with `adb push` of rootCA + emulator restart.

---

### Option 2: Custom hostname (`passkeys.local`) + manual DNS

**Description:** Create hostname `passkeys.local` in Mac `/etc/hosts` and on the emulator.
mkcert issues cert for `passkeys.local`. `RP_ID=passkeys.local`.

**Pros:**
- Simulates a real domain, closer to production
- Works on a physical device on the same Wi-Fi

**Cons:**
- Editing emulator `/etc/hosts` needs root or a specific AVD
- Mac IP can change (DHCP), breaking config
- More setup steps

**Scoring:**
| Criterion | Score | Notes |
|----------|-------|-------|
| Setup complexity | Medium | Needs root on emulator or specific AVD |
| WebAuthn compatibility | Full | Valid domain |
| TLS trust on Android | Needs config | Same network_security + DNS |
| Maintainability | Medium | IP can change |
| Iteration speed | Medium | More variables to debug |

**Effort:** Medium — ~4h setup.  
**Risk:** Medium. DNS and dynamic IP can cause flakiness.

---

### Option 3: ngrok (public HTTPS tunnel)

**Description:** Use ngrok to expose the local server over HTTPS with a public-CA cert.

**Pros:**
- Trusted cert automatically — no CA setup on Android
- Works on physical device and emulator with little extra config

**Cons:**
- Needs internet (violates "local only")
- URL changes on free plan restarts
- Added latency

**Scoring:**
| Criterion | Score | Notes |
|----------|-------|-------|
| Setup complexity | High | One command |
| WebAuthn compatibility | Full | Valid HTTPS |
| TLS trust on Android | Automatic | Public CA |
| Maintainability | Low | Unstable URL, internet dependent |
| Iteration speed | High | — |

**Effort:** Very low — 15 min.  
**Risk:** High for "local only". Not the primary option.

## Recommendation

**Option 1: `localhost` + `adb reverse` + mkcert**

Lowest complexity, full WebAuthn compatibility, and all pieces run locally with no external
dependencies. Re-running `adb` after an emulator restart is acceptable for a POC.

---

## Technical design

### System architecture

```
┌─────────────────── macOS ───────────────────┐
│                                             │
│  docker-compose                             │
│  ├── mongodb:27017                          │
│  └── redis:6379                            │
│                                             │
│  passkeys-server (Node.js)                 │
│  └── https://localhost:3000                 │
│       ├── POST /generate-registration-options│
│       ├── POST /verify-registration          │
│       ├── POST /generate-authentication-options│
│       ├── POST /verify-authentication         │
│       └── GET  /.well-known/assetlinks.json  │
│                                             │
│  mkcert CA ──────────────────────────────┐  │
│  cert: localhost+1.pem                   │  │
│  key:  localhost+1-key.pem                │  │
└──────────────────────────────────────────┼──┘
                                           │ adb reverse tcp:3000 tcp:3000
┌──────── Android Emulator ────────────────┼──┐
│                                          │  │
│  passkeys-app (Expo + React Native)     │  │
│  └── https://localhost:3000 ←───────────┘  │
│       network_security_config.xml           │
│       └── trust-anchors: mkcert rootCA    │
│                                            │
│  Android Credential Manager                │
│  └── passkey scope: localhost              │
└────────────────────────────────────────────┘
```

### Environment configuration

**passkeys-server/.env**

```env
RP_ID=localhost
RP_NAME=Passkeys POC
RP_ORIGIN=https://localhost:3000
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017
DB_NAME=passkeys
COLLECTION_NAME=users
REDIS_URL=redis://localhost:6379
SESSION_SECRET=<32-bytes-hex>
LOG_LEVEL=debug
NODE_ENV=development
ANDROID_CERT_FINGERPRINT=<sha256-from-debug-keystore>
```

### Server changes

#### `passkeys-server/src/index.ts`
Load TLS certificates and pass to Fastify:

```typescript
import fs from 'fs';
import path from 'path';

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/localhost+1-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/localhost+1.pem')),
};

const server = fastify({
  https: httpsOptions,
  logger: false,
});
```

#### `passkeys-server/src/infra/api/index.ts`
Add `cookie.secure: true` regardless of environment (HTTPS always on):

```typescript
server.register(fastifySession, {
  secret: SESSION_KEY,
  cookieName: 'sessionId',
  cookie: {
    maxAge: 1800000,
    secure: true, // always true — server is always HTTPS now
  },
});
```

Add iOS endpoint (not tested in POC, but completes the spec):

```typescript
server.get('/.well-known/apple-app-site-association', async (request, reply) => {
  reply.send({
    webcredentials: {
      apps: ['TEAMID.com.anonymous.passkeys'],
    },
  });
});
```

### App changes

#### New file: `android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <debug-overrides>
    <trust-anchors>
      <!-- System CA (includes mkcert after install) -->
      <certificates src="system"/>
      <!-- User-installed CAs on the emulator -->
      <certificates src="user"/>
    </trust-anchors>
  </debug-overrides>
</network-security-config>
```

#### `android/app/src/main/AndroidManifest.xml`
Reference the security config:

```xml
<application
  android:networkSecurityConfig="@xml/network_security_config"
  ...>
```

#### New file: `passkeys-app/services/api.ts`

```typescript
const BASE_URL = 'https://localhost:3000';

export const generateRegistrationOptions = (username: string) =>
  fetch(`${BASE_URL}/generate-registration-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  }).then(r => r.json());

export const verifyRegistration = (username: string, response: unknown) =>
  fetch(`${BASE_URL}/verify-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-username': username },
    body: JSON.stringify(response),
  }).then(r => r.json());

export const generateAuthenticationOptions = (username: string) =>
  fetch(`${BASE_URL}/generate-authentication-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-username': username },
  }).then(r => r.json());

export const verifyAuthentication = (username: string, response: unknown) =>
  fetch(`${BASE_URL}/verify-authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-username': username },
    body: JSON.stringify(response),
  }).then(r => r.json());
```

#### App screens

**`passkeys-app/app/index.tsx`** — entry (login/register):
- Username input
- "Register" → `generateRegistrationOptions` + `react-native-passkey` + `verifyRegistration`
- "Sign in" → `generateAuthenticationOptions` + `react-native-passkey` + `verifyAuthentication`
- Navigate to `/(tabs)` on success (note: final harness uses `app/home.tsx`; see Decision Record)

**`passkeys-app/app/(tabs)/index.tsx`** — authenticated home (superseded by `app/home.tsx` in the delivered POC):
- Show logged-in username
- Logout button

### Passkey library

Use `react-native-passkey` (package `react-native-passkey`, author: f-23):

```bash
npx expo install react-native-passkey
npx expo prebuild --platform android
```

Expected API:

```typescript
import { Passkey } from 'react-native-passkey';

// Registration
const credential = await Passkey.create(registrationOptionsJSON);

// Authentication
const assertion = await Passkey.get(authenticationOptionsJSON);
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

## Implementation plan

### Phase 1 — Infrastructure and HTTPS (server) ✓ COMPLETED

| Step | File(s) | Description |
|------|---------|-------------|
| 1.1 | `docker-compose.yml` | Create at project root |
| 1.2 | `passkeys-server/certs/` | Generate certificates with mkcert |
| 1.3 | `passkeys-server/src/index.ts` | Enable HTTPS on Fastify |
| 1.4 | `passkeys-server/src/infra/api/index.ts` | `cookie.secure: true`, AASA endpoint |
| 1.5 | `passkeys-server/.env` | `RP_ID=localhost`, `RP_ORIGIN=https://localhost:3000` |
| 1.6 | `passkeys-server/.gitignore` | Ignore `certs/` |

**Completion criterion:** `curl -k https://localhost:3000/health` returns `{"status":"ok"}` ✓

### Phase 1b — Server unit tests

| Step | File(s) | Description |
|------|---------|-------------|
| 1b.1 | `jest.config.ts`, `package.json` | Jest + ts-jest with coverage |
| 1b.2 | `src/registration/__tests__/index.test.ts` | 5 registration test cases |
| 1b.3 | `src/authentication/__tests__/index.test.ts` | 5 authentication test cases |
| 1b.4 | — | Coverage check ≥ 80% |

**Completion criterion:** `npm test` — all tests pass, coverage ≥ 80% in `registration/` and `authentication/`

**Mock strategy:** external deps (`database`, `redis`, `@simplewebauthn/server`) are mocked with inline `jest.mock()` per test file. No global `__mocks__`.

### Phase 2 — Android app

| Step | File(s) | Description |
|------|---------|-------------|
| 2.1 | `passkeys-app/package.json` | Install `react-native-passkey` |
| 2.2 | — | `expo prebuild --platform android` |
| 2.3 | `android/app/src/main/res/xml/network_security_config.xml` | User CA trust |
| 2.4 | `android/app/src/main/AndroidManifest.xml` | Reference network_security_config |
| 2.5 | `passkeys-app/services/api.ts` | HTTP client for server |
| 2.6 | `passkeys-app/app/index.tsx` | Login/register screen |
| 2.7 | `passkeys-app/app/(tabs)/index.tsx` | Authenticated home |
| 2.8 | `passkeys-app/services/__tests__/api.test.ts` | HTTP client unit tests |

**Completion criterion:** app builds on Android API 34+ emulator and `npm test` in the app passes

### Phase 3 — Integration and E2E tests

| Step | Description |
|------|-------------|
| 3.1 | Get SHA-256 of debug keystore and set `ANDROID_CERT_FINGERPRINT` |
| 3.2 | Install mkcert rootCA on emulator via `adb push` |
| 3.3 | Run `adb reverse tcp:3000 tcp:3000` |
| 3.4 | Start infra (docker-compose) and server |
| 3.5 | Build and install app on emulator |
| 3.6 | E2E: register user |
| 3.7 | E2E: authenticate user |

**Completion criterion:** full register → authenticate flow succeeds on the emulator

### Rollback

Phases are independent. Rolling back one does not break the others:
- Phase 1: reverting `index.ts` to HTTP removes HTTPS without affecting the app
- Phase 2: `expo prebuild` can be run again from scratch
- Phase 3: manual steps, no persistent state

## Open questions

1. **`react-native-passkey` vs alternatives:** confirm `react-native-passkey` (f-23) supports
   Expo SDK 53 + React Native 0.79. Alternatives: `@react-native-passkeys/passkeys` or direct
   `expo-modules-core` integration.

2. **Digital Asset Links on localhost:** does Android Credential Manager validate
   `/.well-known/assetlinks.json` on `localhost`? Needs empirical check — may need a dev flag or
   emulator without Play Protect.

3. **Minimum Android version:** passkeys via Credential Manager need Android 9 (API 28+).
   Confirm the AVD image is API 28+.

4. **Auth state in the app:** use `AsyncStorage` or in-memory React state for the POC? Memory is
   enough for a POC but is lost on reload.

5. **`expo-dev-client` vs Expo Go:** `react-native-passkey` needs native modules, so
   `expo-dev-client` is required — not Expo Go.

## Decision record

**Decision:** Option 1 (`localhost` + `adb reverse` + mkcert) implemented as specified.

**Date:** 2026-04-24

**Main points:**

- mkcert + `adb reverse` worked as expected. Cert `localhost+2.pem` was generated with 3 SANs; the server loads from `passkeys-server/certs/`.
- `react-native-passkey` v3.3.3 is compatible with Expo SDK 53 / RN 0.79 without code changes.
- Debug keystore is at `passkeys-app/android/app/debug.keystore` (not `~/.android/`). SHA-256 recorded in `ANDROID_CERT_FINGERPRINT`.
- `ANDROID_ORIGIN` was required in addition to `RP_ORIGIN` for Android Credential Manager to accept passkey creation.
- `generate-authentication-options` requires an explicit `{}` body — sending `undefined` returns 400.
- Home screen moved to `app/home.tsx` to resolve route ambiguity between `app/index.tsx` and `app/(tabs)/index.tsx`.
- Full flow (register + authenticate) succeeded: biometric prompt, passkey created, home shown, logout, re-auth with same username.
- Gradle 7.3.3 incompatible with Expo SDK 53: fixed by updating `sdkVersion` from `45.0.0` to `53.0.0` in `app.json` and running `expo prebuild --clean`.
