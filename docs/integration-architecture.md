# Integration architecture — app ↔ server

## Parts

| From | To | Mechanism |
|------|-----|-----------|
| `passkeys-app` | `passkeys-server` | HTTPS JSON (`fetch` from `services/api.ts`) |
| Server | Android app identity | `/.well-known/assetlinks.json` + env fingerprints (`ANDROID_*` in server setup) |

## Protocol

- **Application layer:** REST-style JSON over **HTTPS** (local dev uses mkcert-issued certificates).
- **No** separate GraphQL or gRPC in this repo.

## Auth / session

- After successful **verify-registration** or **verify-authentication**, the server establishes a **session** (Fastify session/cookie stack — see server dependencies and `infra/api`).

## Local development networking

- **Emulator → host `localhost:3000`:** `adb reverse tcp:3000 tcp:3000` (run again when emulator restarts).
- **TLS trust:** install mkcert root CA on the emulator to avoid certificate errors to `https://localhost:3000`.

## Data ownership

- **User records and credentials:** MongoDB (server only).
- **Challenges:** Redis (server only); not exposed to the client as durable state.

## Contract surface

- Single base URL; paths documented in [api-contracts-server.md](./api-contracts-server.md).
- The app **must** keep all HTTP in `services/api.ts` so contract changes stay auditable.
