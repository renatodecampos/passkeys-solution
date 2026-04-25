# Source tree analysis

*Quick scan — structure and role of major directories. Critical folders align with `backend` and `mobile` documentation-requirements profiles.*

## Repository root

```
passkeys-solution/
├── passkeys-server/     # Part: server (Fastify API)
├── passkeys-app/        # Part: app (Expo / React Native)
├── docs/                 # Project knowledge & generated indexes
├── tasks/                # Per-RFC phase status (harness)
├── rfcs/                 # RFC drafts and completed specs
├── _bmad/                # BMad module config
├── _bmad-output/         # BMad / planning artifacts, project-context.md
├── docker-compose.yml    # MongoDB + Redis (local dev)
└── README.md
```

## Part: `passkeys-server/`

| Path | Purpose |
|------|---------|
| `src/index.ts` | Server bootstrap (HTTPS, DB, routes) |
| `src/infra/api/` | **Fastify routes** — only HTTP layer; business logic not here |
| `src/registration/` | WebAuthn registration (options + verification) |
| `src/authentication/` | WebAuthn authentication (options + verification) |
| `src/infra/database/` | MongoDB and Redis access |
| `src/setup/` | Environment and configuration |
| `src/types/` | Shared types (e.g. `UserModel`) |
| `src/infra/logger.ts` | Logging |
| `certs/` | Local TLS assets (e.g. mkcert) |
| `src/**/*.test.ts` | Jest tests |

**Entry point:** `src/index.ts` → Fastify app registers routes from `infra/api`.

## Part: `passkeys-app/`

| Path | Purpose |
|------|---------|
| `app/` | **Expo Router** file-based UI (`index`, `home`, `(tabs)/`, layouts) |
| `services/api.ts` | **Only** module that calls the backend (`fetch` to `https://localhost:3000`) |
| `android/`, `ios/` | Native projects (prebuild) |
| `app.json` / `expo` config | Expo metadata |

**Entry:** Expo Router — `app/index.tsx` (public), `app/home.tsx` (authenticated).

## Cross-cutting (harness / process)

| Path | Purpose |
|------|---------|
| `tasks/rfc-*/fase-*.md` | Phase status, subtasks, completion criteria |
| `rfcs/` | Initiative specs and decision records |

## Multi-part interface

- **App → server:** HTTPS JSON to `https://localhost:3000` (emulator: `adb reverse tcp:3000 tcp:3000`). See [integration-architecture.md](./integration-architecture.md).
