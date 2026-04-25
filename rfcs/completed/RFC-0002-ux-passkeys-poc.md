---
rfc_id: RFC-0002
title: Android passkeys PoC UX
status: COMPLETED
author: Renato de Campos
reviewers: []
created: 2026-04-25
last_updated: 2026-04-25
decision_date: 2026-04-25
---

# RFC-0002: Android passkeys PoC UX

## Overview

This RFC specifies the UX evolution of the Android passkeys PoC after RFC-0001 is completed.
The goal is to turn the already validated functional flow into a clearer, more reliable, and
more diagnostic demo experience: create passkey, sign in with passkey, show server verification
proof, and recover from common local setup failures.

The product/UX source is `_bmad-output/planning-artifacts/ux-design-specification.md`, completed
on 2026-04-25. This RFC turns that specification into an implementable engineering harness.

## Background & Context

### Current state

RFC-0001 is complete. The system already runs the end-to-end flow on Android:

```
passkeys-server
└── Local HTTPS at https://localhost:3000 with mkcert

passkeys-app
├── app/index.tsx      # simple username screen, register and sign in
├── app/home.tsx       # simple authenticated screen
└── services/api.ts    # HTTP calls to the server
```

The technical flow works, but the UI is still minimal POC level: centered layout, generic
copy, `Alert` for validation, limited feedback, no keyboard-safe behavior, and no visible proof
of the JSON verified by the server.

### Related documents

- `rfcs/completed/RFC-0001-passkeys-poc-completion.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/ux-design-directions.html`

### Glossary

| Term | Definition |
|------|------------|
| Calm Card | Visual direction for the entry screen: simple, clear, demo-safe card |
| Keyboard-Safe Form | Behavior where input, actions, and feedback stay accessible with the keyboard open |
| Home Proof | Authenticated screen showing concrete passkey verification proof |
| StatusMessage | Inline feedback for loading, success, cancel, and error |
| ServerVerificationCard | Card summarizing server-verified return after register/authenticate |

## Problem statement

The POC proves technical feasibility but does not communicate the experience well. For technical
reviewers, HTTPS issues, CA, `adb reverse`, missing credentials, or canceling the prompt can look
like the same generic error. The authenticated screen also does not show enough evidence that the
server validated the WebAuthn response.

**If we do not address this:** the POC stays functional but less convincing in demos and less useful
for debugging. Reviewers must infer too much from code or logs.

## Goals & Non-Goals

### Goals

- Implement the chosen UX direction: Calm Card + Keyboard-Safe Form + Home Proof
- Use only React Native primitives and local styles, no extra UI library
- Replace `Alert` feedback with persistent inline messages
- Keep Android Credential Manager as the trust moment
- On home, show a short server verification proof (`verified`, method, username)
- Make common errors more diagnostic: empty username, cancel, missing credential, local setup
- Keep architecture: HTTP only in `services/api.ts`; passkey only in `app/index.tsx`

### Non-Goals

- Redesign the WebAuthn backend
- Add account management, profile, or passkey management
- Persist session with AsyncStorage or secure storage
- Add iOS support
- Add a new visual library
- Solve production setup or cloud deploy

## Evaluation criteria

| Criterion | Weight | Description |
|----------|--------|-------------|
| Flow clarity | High | User understands create passkey vs sign in with passkey |
| Failure diagnosis | High | Errors point to the likely problem without logs |
| Mobile accessibility | High | Visible labels, contrast, touch targets, text feedback |
| Perceived security | Medium | UI hands off to native prompt without faking sensitive security |
| Maintainability | Medium | Few files, no new dependency, Expo SDK 53 compatible |
| Demo readiness | Medium | Repeatable, visually reliable flow on emulator |

## Options analysis

### Option 1: Incremental refinement of current screens

**Description:** Evolve `app/index.tsx` and `app/home.tsx` with local styles, inline state,
keyboard-safe layout, and verification card, without a new visual architecture.

**Pros:**
- Smaller scope and lower risk for a working POC
- Keeps passkey logic in `app/index.tsx`
- No new dependencies
- Easier for technical reviewers

**Cons:**
- Components may stay local and less reusable
- No extensible visual base for a future product
- Visual testing still mostly manual on emulator

**Scoring:**
| Criterion | Score | Notes |
|----------|-------|-------|
| Flow clarity | High | Copy and hierarchy can be adjusted directly |
| Failure diagnosis | High | Message mapping can be implemented in the current flow |
| Mobile accessibility | High | RN primitives support labels and touch targets |
| Perceived security | High | Keeps native handoff without extra abstractions |
| Maintainability | High | Few files and no new dependency |
| Demo readiness | High | Lower chance of breaking the validated flow |

**Effort:** Low to medium — 0.5 to 1 day.  
**Risk:** Low. Main risk is mixing too much async UI in `app/index.tsx`; mitigate with local state/message helpers.

---

### Option 2: Create a local mini design system

**Description:** Add components and tokens in dedicated folders (`components/`, `constants/`, or
`ui/`) and refactor screens to consume them.

**Pros:**
- Better visual separation and reuse
- Easier expansion if the POC grows
- Less duplication between entry and home

**Cons:**
- More files and abstractions for a small surface
- Can conflict with keeping the POC easy to inspect
- Higher review cost without a clear immediate need

**Scoring:**
| Criterion | Score | Notes |
|----------|-------|-------|
| Flow clarity | High | Named components help reading |
| Failure diagnosis | Medium | Still depends on screen flow |
| Mobile accessibility | High | Can standardize labels and touch targets |
| Perceived security | High | No direct impact |
| Maintainability | Medium | Better if it grows, heavier if it stays a POC |
| Demo readiness | Medium | Larger refactor increases regression risk |

**Effort:** Medium — 1 to 2 days.  
**Risk:** Medium. Abstraction may be premature at current scale.

---

### Option 3: Introduce a UI library

**Description:** Adopt a React Native UI library to speed up components, states, and theming.

**Pros:**
- Ready-made, consistent components
- May speed future product work
- Some packages offer accessibility and theming

**Cons:**
- Adds dependency not needed for scope
- May need native tweaks or Expo compatibility
- More noise for a POC focused on passkey/WebAuthn

**Scoring:**
| Criterion | Score | Notes |
|----------|-------|-------|
| Flow clarity | Medium | Components help but do not fix copy/state |
| Failure diagnosis | Medium | No direct benefit |
| Mobile accessibility | Medium | Varies by library |
| Perceived security | Medium | May compete visually with native prompt |
| Maintainability | Low | New dependency and config surface |
| Demo readiness | Medium | Visual gain, setup risk increases |

**Effort:** Medium.  
**Risk:** Medium to high for a local POC. Dismissed while scope stays small.

## Recommendation

**Option 1: Incremental screen refinement**

This option meets clarity, diagnosis, accessibility, and demo readiness with the lowest risk to
the technical flow already validated in RFC-0001. The decision accepts less initial reuse to keep
simplicity, auditability, and zero new dependencies.

---

## Technical design

### Visual direction

Implement the combination from the UX spec:

- **Entry:** Calm Card with passkey hero, short explanation, username, actions, and inline status
- **Focused input:** Keyboard-Safe Form with `KeyboardAvoidingView` + `ScrollView`
- **Home:** Home Proof with username, authenticated status, `passkey` method, and short server return summary

### Local palette and tokens

Use values from the specification:

| Use | Value |
|-----|-------|
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Text primary | `#0F172A` |
| Text secondary | `#475569` |
| Border | `#CBD5E1` |
| Primary | `#2563EB` |
| Primary pressed | `#1D4ED8` |
| Success | `#16A34A` |
| Error | `#DC2626` |
| Info surface | `#EFF6FF` |
| Error surface | `#FEF2F2` |

### Entry screen

`passkeys-app/app/index.tsx` must keep `react-native-passkey` imported in this file and
continue calling `services/api.ts` for all requests.

Expected behaviors:

- Validate empty username before any server call or native prompt
- Show pre-dialog message: Android will ask biometric/screen lock confirmation
- Disable buttons while `loading`
- Replace `Alert.alert` with inline `StatusMessage`
- Differentiate, when possible, cancel, missing credential, and local setup
- Navigate to `/home` with enough data to render proof state

### Home screen

`passkeys-app/app/home.tsx` must show:

- authenticated username
- `verified: true` when the server confirms
- method `passkey`
- response type `JSON`
- logout button that returns to entry without deleting the passkey

### API service

`passkeys-app/services/api.ts` remains the only HTTP entry. For UX, errors from `postJSON` may
improve, but no passkey or UI logic in the service.

### Accessibility

Minimum requirements:

- visible label for username
- `autoCapitalize="none"` and `autoCorrect={false}`
- buttons at least 44px tall
- state not indicated by color alone
- textual loading next to spinner
- error messages persist until the next action

## Implementation plan

### Phase 1 — Android app UX

| Step | File(s) | Description |
|------|---------|-------------|
| 1.1 | `passkeys-app/app/index.tsx` | Calm Card, inline status, passkey copy, clear actions |
| 1.2 | `passkeys-app/app/index.tsx` | Keyboard-Safe Form with `KeyboardAvoidingView` and `ScrollView` |
| 1.3 | `passkeys-app/app/index.tsx`, `passkeys-app/services/api.ts` | Loading, success, cancel, and diagnostic error feedback |
| 1.4 | `passkeys-app/app/home.tsx` | Home Proof with server verification summary |

**Task file:** `tasks/rfc-0002/fase-1-ux-app.md`  
**Completion criterion:** `cd passkeys-app && npm test && npm run lint`

### Phase 2 — UX validation and E2E

| Step | File(s) | Description |
|------|---------|-------------|
| 2.1 | `passkeys-app/services/__tests__/api.test.ts` | Adjust unit tests if service error shape changes |
| 2.2 | — | Validate register and login on Android emulator with keyboard visible |
| 2.3 | — | Validate native prompt cancel and server unavailable |
| 2.4 | `tasks/rfc-0002/fase-2-ux-validacao.md` | Record evidence and gaps in the phase file (Notas) |

**Task file:** `tasks/rfc-0002/fase-2-ux-validacao.md`  
**Completion criterion:** manual flow on emulator confirms register → home proof → logout → login → home proof, and `cd passkeys-app && npm test && npm run lint` passes.

### Phase 3 — Documentation

Last phase of RFC-0002. Runs after phase 2 is `[x] completed`.  
**Task file:** `tasks/rfc-0002/fase-3-documentacao.md`

Fixed scope:
- Update `CLAUDE.md` only if there is new non-obvious setup
- Update app README if usage/demo section is affected
- Move this RFC to `rfcs/completed/` and complete `## Decision Record`

**Completion criterion:** a new reviewer can understand and demonstrate the UX flow from the relevant documentation.

### Rollback

Rollback is app-only:

- Revert `passkeys-app/app/index.tsx` to the previous simple screen
- Revert `passkeys-app/app/home.tsx` to the previous simple home
- Revert `passkeys-app/services/api.ts` if error shape changed

No backend changes are planned.

## Open questions

1. **Verification data on `/home`:** are route params enough for the POC, or add simple shared state? Initial recommendation: route params to avoid storage.
2. **Native passkey error granularity:** confirm which messages/codes `react-native-passkey` exposes for cancel and missing credential.
3. **ServerVerificationCard:** show summary only (`verified`, method, username) or include raw JSON snippet? Initial recommendation: summary for readability.
4. **Validation screenshots:** decide whether phase 2 should attach manual screenshots or only a text checklist.

## Decision record

- **Date:** 2026-04-25  
- **Decision:** Keep **Option 1 (incremental refinement)** from “Recommendation” — completed without an extra UI library, HTTP only in `services/api.ts` and `react-native-passkey` only in `app/index.tsx`, per `AGENTS.md`.  
- **Verified deliverables:** Entry screen (Calm Card, inline status, keyboard-safe form), Home Proof in `app/home.tsx`, app tests and lint (`tasks/rfc-0002/fase-1-ux-app.md`, `fase-2-ux-validacao.md`), documentation and this file in `rfcs/completed/`.  
- **Open questions (resolved in implementation):**
  1. `/home` data: **route params** after `verifyRegistration` / `verifyAuthentication` — enough for the POC.  
  2. Native errors: handled via local helpers (cancel, network, HTTP) aligned with `react-native-passkey` and server responses.  
  3. Server proof: **summary** (`verified`, method, username, response type) — no raw JSON in the UI.  
  4. Validation: evidence in phase 2 **Notes** (checklist; no screenshot requirement in the harness).  
- **Out of scope (confirmed):** no WebAuthn backend change, no iOS, no session persistence, no new visual dependency.
