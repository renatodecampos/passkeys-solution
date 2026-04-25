---
project_name: 'passkeys-solution'
user_name: 'Renato'
date: '2026-04-25'
sections_completed: ['technology_stack', 'language_specific_rules', 'framework_specific_rules', 'testing_rules', 'code_quality_style_rules', 'development_workflow_rules', 'critical_dont_miss_rules']
existing_patterns_found: 16
status: 'complete'
rule_count: 55
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Runtime: Node.js 20+.
- Server: TypeScript 5.8.3, Fastify 5.3.2, `@simplewebauthn/server` 13.1.1.
- Server infra: MongoDB driver 6.16.0, ioredis 5.6.1, Winston 3.17.0, dotenv 16.5.0.
- Server security: `@fastify/helmet` 13.0.1, CORS 11.0.1, rate-limit 10.2.2, secure/session plugins.
- App: Expo SDK 53.0.7, React 19.0.0, React Native 0.79.2, Expo Router 5.0.5.
- Passkeys app integration: `react-native-passkey` 3.3.3, `expo-dev-client` 5.1.8. Do not use Expo Go for native passkey testing.
- Testing: Jest 30.3.0, ts-jest 29.4.9, jest-fetch-mock 3.0.3.
- Local dependencies: Docker MongoDB 7 and Redis 7; mkcert for local HTTPS; Android emulator with `adb reverse tcp:3000 tcp:3000`.

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript is strict in both workspaces. Avoid `any`; use `unknown`, library-provided types, or narrow casts at external boundaries.
- Server modules should read environment values from `passkeys-server/src/setup/index.ts`, not directly from `process.env` outside setup.
- Keep imports at the top of files. Existing code uses named exports for service/business functions.
- Server code should use `logger` from `infra/logger.ts`; avoid `console.log`/`console.error` in implementation code.
- Treat WebAuthn request/response payloads as typed boundary data: use `RegistrationResponseJSON`, `AuthenticationResponseJSON`, and SimpleWebAuthn option types where available.
- App code uses the `@/` alias for project-root imports; prefer it over deep relative paths.
- In React Native handlers, catch errors as `unknown` and narrow with `instanceof Error` before reading messages.

### Framework-Specific Rules

- Server routes in `passkeys-server/src/infra/api/index.ts` must stay thin: parse request data, call `registration` or `authentication`, and return HTTP responses.
- Do not import `infra/database/database.ts` directly into API routes. Business modules own database interactions.
- Registration logic belongs in `passkeys-server/src/registration/index.ts`; authentication logic belongs in `passkeys-server/src/authentication/index.ts`.
- WebAuthn challenges are stored in Redis with 5-minute TTL using keys like `challenge:${username}-registration` and `challenge:${username}-authentication`.
- Expected origins and RP config come from setup values; Android origin support is additive via `ANDROID_ORIGIN`.
- Fastify server runs over HTTPS locally. Keep cert assumptions aligned with `passkeys-server/certs/localhost+2.pem` and `localhost+2-key.pem` unless changing the documented setup.
- App HTTP calls must go through `passkeys-app/services/api.ts`; do not call `fetch` directly from screens.
- Keep `react-native-passkey` usage concentrated in `passkeys-app/app/index.tsx`.
- Expo Router screens should use existing file-based routing; authenticated home currently routes to `/home`.

### Testing Rules

- Server tests run from `passkeys-server/src` and match `**/__tests__/**/*.test.ts`.
- Server Jest coverage is collected only from `src/registration/**/*.ts` and `src/authentication/**/*.ts`; global thresholds require at least 80% lines and 80% functions.
- App tests run from `passkeys-app/services` and match `**/__tests__/**/*.test.ts`.
- App API tests use `jest-fetch-mock`; reset mocks in `beforeEach`.
- Keep `services/api.ts` tests focused on HTTP contract: URL, method, headers, body, JSON response, and error propagation.
- For WebAuthn business tests, mock database and Redis boundaries rather than requiring live MongoDB/Redis.
- Use `npm test` inside each workspace; server test command is `jest --coverage`.

### Code Quality & Style Rules

- Keep edits scoped to the current phase/task; do not refactor unrelated modules.
- Preserve the server layer boundaries documented in `AGENTS.md`; avoid moving business logic into Fastify routes.
- The app follows Expo Router file-based routing. Keep API helpers in `services/` and UI screens under `app/`.
- Use Expo ESLint config in the app via `npm run lint`; server has TypeScript build/test verification but no ESLint config.
- Prefer concise implementation comments only when they explain non-obvious WebAuthn, TLS, Android, or Redis behavior.
- Do not add dependencies unless they are specified by the RFC/task or clearly required for the requested change.
- Keep generated/build outputs out of hand edits; source changes should be in `src/`, `app/`, `services/`, config, docs, or task/RFC files.

### Development Workflow Rules

- This repo uses a phase harness per RFC under `tasks/rfc-xxxx/`. Before phase work, read `CLAUDE.md`, the relevant `tasks/rfc-xxxx/fase-*.md`, and the active RFC in `rfcs/draft/` or `rfcs/completed/`.
- Update the relevant phase status file when starting and completing subtasks: `[~] in_progress`, `[x] completed`, `[!] blocked`, or `[-] skipped`.
- Do not mark a phase or subtask complete without running the real verification command listed in that phase file.
- If blocked, record the blocker in the phase file and do not advance dependent subtasks.
- Local server development requires Docker MongoDB/Redis, HTTPS certs from mkcert, and `npm run dev` in `passkeys-server`.
- Android passkey testing requires `adb reverse tcp:3000 tcp:3000`, mkcert CA installed in the emulator, and a dev-client/native build via `npx expo run:android`.
- Keep RFC/task harness files authoritative; do not rename existing phase files or modify unrelated RFC phases.

### Critical Don't-Miss Rules

- Do not switch the POC away from the chosen local model: `https://localhost:3000` + `RP_ID=localhost` + `adb reverse` + mkcert.
- Do not confuse Android Digital Asset Links fingerprint with the TLS certificate fingerprint. `ANDROID_CERT_FINGERPRINT` is the app debug keystore SHA-256.
- `ANDROID_ORIGIN` must be added to expected origins for native WebAuthn verification; do not replace the HTTPS web origin.
- The server must stay HTTPS-only for app/WebAuthn testing; HTTP may make simple API calls work but breaks the real passkey flow.
- Redis challenges are single-ceremony temporary state. Do not persist challenges in MongoDB or remove the TTL without a design change.
- Delete or invalidate authentication challenges after successful verification; avoid challenge reuse.
- Do not use Expo Go for `react-native-passkey`; use the dev client/native Android build.
- Re-run `adb reverse tcp:3000 tcp:3000` after emulator restart.
- Never commit secrets, `.env`, private keys, or generated local certificate keys.
- If changing passkey payload shape, verify both app service tests and server WebAuthn tests because the boundary is cross-platform and strict.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing code in this repository.
- Follow all rules as documented; when unsure, prefer the stricter project boundary.
- Update this file only when durable project patterns or stack constraints change.

**For Humans:**

- Keep this file lean and focused on non-obvious agent guidance.
- Update it when dependencies, architecture, testing boundaries, or local setup change.
- Remove rules that become obsolete or duplicated elsewhere.

Last Updated: 2026-04-25
