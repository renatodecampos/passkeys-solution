# Development guide — passkeys-solution

## Prerequisites

- **Node.js 20+**
- **Docker** — MongoDB and Redis (`docker-compose`)
- **mkcert** — local HTTPS for the server
- **Android:** Android Studio, API 34+ emulator (**Google APIs** image per `CLAUDE.md`), **expo-dev-client** builds (not Expo Go for passkeys)

## Infrastructure

```bash
docker compose up -d
```

- MongoDB: port **27017**
- Redis: port **6379**

## passkeys-server

```bash
cd passkeys-server
# Copy .env from .env-example and fill values (RP_*, MONGODB_URI, REDIS_URL, SESSION_SECRET, ANDROID_*, etc.)
npm install
npm run dev
```

- Health: `curl -k https://localhost:3000/health`
- **Tests:** `npm test` (Jest; use `--testPathPatterns` for filters on Jest 29+)

## passkeys-app

```bash
cd passkeys-app
npm install
npx expo run:android
```

- **Emulator port forwarding:** `adb reverse tcp:3000 tcp:3000`
- **Lint:** `npm run lint`
- **Tests:** `npm test`

## TLS (server + emulator)

- Generate certs in `passkeys-server/certs` with mkcert (see `CLAUDE.md`).
- Install CA on emulator; use virtual fingerprint for biometric tests.

## CI/CD

- **No `.github/workflows/`** in this scan — add pipeline docs here when present.

## Contribution

- Harness: update phase files in `tasks/` when working through RFCs; follow `AGENTS.md` and `AGENTS.md` §8 Feedback Forward on phase completion.
