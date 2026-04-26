# passkeys-app

**Expo dev build** client for the passkeys (WebAuthn) PoC. Do **not** use **Expo Go** — the native flow requires `expo-dev-client`.

## Repository documentation

Full setup (Docker, HTTPS with mkcert, `adb reverse`, server env vars, Android fingerprint): [`../CLAUDE.md`](../CLAUDE.md).

## Icon and splash (RFC-0003)

Branded PNGs live in [`assets/images/`](./assets/images/) (`icon`, `adaptive-icon`, `splash-icon`, `favicon`, and Android-specific `splash-android`). `app.json` uses Light Clean background `#F8FAFC` for the app shell, `expo-splash-screen`, and the Android adaptive icon. If you change those assets or splash config and the repo contains a generated [`android/`](./android/) tree, run `npx expo prebuild --platform android` (or a full `npx expo run:android` that runs prebuild) so native `colors.xml`, splash drawables, and mipmaps stay in sync. Spec: [`../rfcs/completed/RFC-0003-visual-identity.md`](../rfcs/completed/RFC-0003-visual-identity.md).

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

## Fluxos — Keystore binding (Android, PoC)

Chave assimétrica no **Android Keystore** (P-256), autenticação forte por biometria, SPKI no servidor, challenge assinado no login. Código: `android/.../keystore/KeystoreBindingModule.kt`, `services/keystoreBinding.ts`, `app/index.tsx`. Servidor: `passkeys-server` (rotas de binding, `evaluateBinding`).

### Registo: passkey + primeira binding

```mermaid
flowchart TB
  subgraph Registo["Registo (passkey + binding Keystore)"]
    R1[Utilizador inicia registo] --> R2[Passkey.create]
    R2 --> R3[POST /verify-registration]
    R3 --> R4{WebAuthn OK?}
    R4 -->|não| R_FAIL[Fim: erro]
    R4 -->|sim| R5{Android + módulo KeystoreBinding?}
    R5 -->|não| R6[Home sem binding local]
    R5 -->|sim| R7[Native: createKey — EC P-256, v3, StrongBox → TEE]
    R7 --> R8[POST /register-keystore-binding — SPKI + algoritmo]
    R8 --> R9[Mongo: keystore_binding + continua sessão]
    R9 --> R6
  end
```

### Login: opções, assinatura de binding e passkey

```mermaid
flowchart TB
  subgraph Login["Sign-in com passkey"]
    L1[POST /generate-authentication-options] --> L2[Redis: challenge WebAuthn + bindingChallenge]
    L2 --> L3[App: retira bindingChallenge das opções do Passkey]
    L3 --> L4{Android + KeystoreBinding + bindingChallenge?}
    L4 -->|não| L7[Passkey.get — só WebAuthn]
    L4 -->|sim| L5[Native: signChallenge]
    L5 --> L6{Resultado sign}
    L6 -->|ok| L6a[Payload: challenge + signature ES256 + unlockHint]
    L6 -->|lost| L6b[Payload: status lost]
    L6 -->|no_key / cancelled / error| L6c[Sem binding útil]
    L6a --> L7
    L6b --> L7
    L6c --> L7
    L7 --> L8[POST /verify-authentication — credencial + binding opcional]
    L8 --> L9[Servidor: WebAuthn verify + evaluateBinding]
    L9 --> L10[Resposta: verified + biometryBindingStatus]
  end
```

### Android — saídas de `signChallenge`

```mermaid
flowchart LR
  subgraph Native["KeystoreBindingModule.signChallenge"]
    N0[challenge string] --> N1{Alias v3 existe?}
    N1 -->|não| NK[Resolve: no_key]
    N1 -->|sim| N2[Signature.initSign / BiometricPrompt]
    N2 --> N3{Exceção / estado}
    N3 -->|KeyPermanentlyInvalidated / equivalente| NL[Resolve: lost]
    N3 -->|OK após auth| NO[Resolve: ok + assinatura]
    N3 -->|cancel / erro prompt| NE[Resolve: cancelled / error]
  end
```

### Servidor — `evaluateBinding` e `biometryBindingStatus`

```mermaid
flowchart TB
  subgraph Server["passkeys-server / verifyAuthentication"]
    S0[body.binding opcional] --> S1{binding.status === lost?}
    S1 -->|sim| GLOST[Outcome: lost]
    S1 -->|não| S2{signature + challenge?}
    S2 -->|falta / mismatch| SERR[not_present ou error conforme regra]
    S2 -->|ok| S3[Verificar assinatura vs SPKI em Mongo]
    S3 -->|falha| SERR2[error]
    S3 -->|ok| SOK[Outcome: ok]
    S0 -.->|ausente| SSKIP[skipped ou not_present consoante WebAuthn]
  end
```

### Sequência (login com binding)

```mermaid
sequenceDiagram
  participant App
  participant API as passkeys-server
  participant Redis
  participant Mongo
  participant KS as Android Keystore

  App->>API: generate-authentication-options
  API->>Redis: guarda challenges
  API-->>App: options + bindingChallenge
  App->>KS: signChallenge(bindingChallenge)
  alt chave inexistente
    KS-->>App: no_key
  else assinatura OK
    KS-->>App: ok + signature
  else chave invalidada
    KS-->>App: lost
  end
  App->>App: Passkey.get (opções sem bindingChallenge)
  App->>API: verify-authentication + binding?
  API->>Mongo: user + keystore_binding
  API->>Redis: confirma challenge binding
  API-->>App: verified, biometryBindingStatus
```

---

## Expo (reference)

This app was created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app). Docs: [Expo](https://docs.expo.dev/), [Expo Router](https://docs.expo.dev/router/introduction/), [development builds](https://docs.expo.dev/develop/development-builds/introduction/).
