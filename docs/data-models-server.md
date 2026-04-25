# Data models — passkeys-server

*Quick scan — no full schema migration folder; persistence is MongoDB + Redis challenges.*

## Primary document model

Defined in `passkeys-server/src/types/index.ts`:

| Field | Purpose |
|-------|---------|
| `id` | User id |
| `username` | Unique username (login id) |
| `displayName` | Display name |
| `credentials` | `WebAuthnCredential[]` from `@simplewebauthn/server` — registered passkeys |

## Storage

| Store | Use |
|-------|-----|
| **MongoDB** | User documents (CRUD in `infra/database/`) |
| **Redis** | Short-lived WebAuthn challenges (TTL, e.g. 5 minutes per `CLAUDE.md`) |

*No Prisma/ORM migration tree in repo — model evolution is in application code and MongoDB collection shape.*
