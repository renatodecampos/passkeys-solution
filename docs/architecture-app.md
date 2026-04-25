# Architecture — passkeys-app

## Executive summary

**Expo Router** drives navigation: a **public** entry screen for register/sign-in with passkey, and a **post-auth** `home` screen. All server I/O is funneled through **`services/api.ts`** so screens stay free of raw `fetch` and passkey calls stay in the right layer per project rules.

## Technology stack

| Category | Choice |
|----------|--------|
| Framework | Expo SDK 53 |
| UI | React 19, React Native 0.79 |
| Navigation | Expo Router 5 (file-based `app/`) |
| Passkeys | `react-native-passkey` (native; requires **dev client**, not Expo Go) |

## Route shape (Expo Router)

| Area | Path | Role |
|------|------|------|
| Root layout | `app/_layout.tsx` | Stack / theme |
| Public entry | `app/index.tsx` | Calm Card, register & sign in (WebAuthn entry) |
| Authenticated | `app/home.tsx` | “Home Proof” / session verification view |
| Tabs | `app/(tabs)/` | Secondary routes (e.g. explore) — not the primary passkey post-login path |

*Per `AGENTS.md`, post-login target is `home`, not `app/(tabs)/index.tsx`.*

## API boundary

- **`services/api.ts`:** `BASE_URL` `https://localhost:3000`, JSON POSTs for the four WebAuthn endpoints, headers for username where required.
- **Passkey orchestration** is intended to live on the **entry** screen per harness rules; do not import `react-native-passkey` outside that flow without updating project conventions.

## Testing

- **Jest** with tests for `services/api.ts` (assert **request** shape, not only responses — see `AGENTS.md` testing rules).

## Native

- **Android** prebuild under `android/`; **iOS** under `ios/` when used.
- Local HTTPS to dev server: **mkcert** on machine; **CA install** on emulator; **adb reverse** for port 3000.
