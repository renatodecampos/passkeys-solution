# Architecture — passkeys-server

## Executive summary

Fastify 5 serves HTTPS with **thin routes** in `infra/api/`. **Registration** and **authentication** WebAuthn flows live in dedicated modules; **MongoDB** stores users and credentials; **Redis** stores ephemeral challenges. **Winston** logs; **@simplewebauthn/server** implements RP operations.

## Layering (mandatory in this repo)

```
HTTP → infra/api (routes, middleware only)
     → registration/ | authentication/ (WebAuthn logic)
     → infra/database/ (MongoDB, Redis)
```

**Forbidden (per `AGENTS.md`):** import database layer directly from ad-hoc code outside these boundaries; business logic in `infra/api/index.ts` beyond wiring.

## Technology stack

| Category | Choice |
|----------|--------|
| Runtime | Node.js 20+ |
| Language | TypeScript (strict) |
| HTTP | Fastify 5.3.x |
| WebAuthn | `@simplewebauthn/server` 13.x |
| Data | `mongodb` driver, `ioredis` |
| Security | Helmet, CORS, rate-limit, session plugins |

## Data flow (conceptual)

1. Client calls **generate-***-**options** → server builds WebAuthn options, stores **challenge in Redis**, returns options.
2. Client completes passkey on device → **verify-*** with credential → server validates with SimpleWebAuthn, **persists or updates** user in MongoDB, issues session.

## Testing

- **Jest** with coverage threshold (see server `package.json` and `CLAUDE.md`).
- Tests colocated as `*.test.ts` under `src/`.

## Configuration

- **Environment variables** are centralized in `src/setup/index.ts` (not scattered `process.env` reads in feature modules).
