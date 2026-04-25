# passkeys-app

**Expo dev build** client for the passkeys (WebAuthn) PoC. Do **not** use **Expo Go** — the native flow requires `expo-dev-client`.

## Repository documentation

Full setup (Docker, HTTPS with mkcert, `adb reverse`, server env vars, Android fingerprint): [`../CLAUDE.md`](../CLAUDE.md).

## Commands

| Command | Purpose |
|---------|---------|
| `npx expo run:android` | Build and install on emulator/device |
| `npm start` | Metro / dev server (after native build) |
| `npm test` | Jest (`services/api.ts` and related tests) |
| `npm run lint` | ESLint (script in `package.json` calls the binary in `node_modules`) |

## UX flow demo (RFC-0002)

1. Infra: `docker-compose up -d`, server in `passkeys-server` (`npm run dev`), `adb reverse tcp:3000 tcp:3000`.
2. Open the app, enter a username.
3. **Create passkey** or **Sign in with passkey** and complete the system prompt.
4. The `/home` route shows a short verification proof (`verified`, `passkey` method, etc.). **Logout** returns to the entry screen (`/`).

Main routes: `app/index.tsx` (entry), `app/home.tsx` (authenticated). HTTP only in `services/api.ts`.

---

## Expo (reference)

This app was created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app). Docs: [Expo](https://docs.expo.dev/), [Expo Router](https://docs.expo.dev/router/introduction/), [development builds](https://docs.expo.dev/develop/development-builds/introduction/).
