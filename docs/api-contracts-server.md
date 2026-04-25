# API contracts — passkeys-server

*Quick scan: routes taken from `passkeys-server/src/infra/api/index.ts` (pattern match). For request/response JSON shapes, see handlers and `@simplewebauthn/server` types.*

**Base URL (dev):** `https://localhost:3000` (local HTTPS; `-k` for curl).

| Method | Path | Role |
|--------|------|------|
| `GET` | `/health` | Liveness — returns `{ status: "ok" }` (pattern) |
| `POST` | `/generate-registration-options` | Start registration — body includes `username` (see route handler) |
| `POST` | `/verify-registration` | Complete registration — WebAuthn attestation + session |
| `POST` | `/generate-authentication-options` | Start authentication — header `x-username` (see app `api.ts`) |
| `POST` | `/verify-authentication` | Complete authentication — WebAuthn assertion + session |
| `GET` | `/.well-known/assetlinks.json` | Android **Digital Asset Links** (passkey / app identity) |
| `GET` | `/.well-known/apple-app-site-association` | Placeholder for Apple association file |

**Security middleware (per project rules):** Helmet, CORS, rate limiting, session/cookies — see `infra/api/index.ts` for exact registration order.

**Client reference:** `passkeys-app/services/api.ts` maps the four WebAuthn flows to these paths.

---

*Deep scan would extract exact TypeScript request/reply types from each handler.*
