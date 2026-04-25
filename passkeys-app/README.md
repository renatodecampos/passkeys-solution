# passkeys-app

Cliente **Expo dev build** da POC de passkeys (WebAuthn). Não use **Expo Go** — o fluxo nativo exige `expo-dev-client`.

## Documentação do repositório

Setup completo (Docker, HTTPS com mkcert, `adb reverse`, variáveis do servidor, fingerprint Android): [`../CLAUDE.md`](../CLAUDE.md).

## Comandos

| Comando | Uso |
|---------|-----|
| `npx expo run:android` | Build e instala no emulador/dispositivo |
| `npm start` | Metro / dev server (após build nativo) |
| `npm test` | Jest (`services/api.ts` e testes associados) |
| `npm run lint` | ESLint (script no `package.json` chama o binário em `node_modules`) |

## Demo do fluxo UX (RFC-0002)

1. Infra: `docker-compose up -d`, server em `passkeys-server` (`npm run dev`), `adb reverse tcp:3000 tcp:3000`.
2. Abra o app, introduza um username.
3. **Create passkey** ou **Sign in with passkey** e conclua o prompt do sistema.
4. A rota `/home` mostra a prova resumida da verificação (`verified`, método `passkey`, etc.). **Logout** volta à entrada (`/`).

Rotas principais: `app/index.tsx` (entrada), `app/home.tsx` (autenticado). HTTP apenas em `services/api.ts`.

---

## Expo (referência)

Este projeto foi criado com [`create-expo-app`](https://www.npmjs.com/package/create-expo-app). Documentação: [Expo](https://docs.expo.dev/), [Expo Router](https://docs.expo.dev/router/introduction/), [development builds](https://docs.expo.dev/develop/development-builds/introduction/).
