---
rfc_id: RFC-0003
title: Visual Identity — App icon, splash screen and Light Clean theme
status: PROPOSED
author: Renato de Campos
reviewers: []
created: 2026-04-25
last_updated: 2026-04-25
decision_date: —
---

# RFC-0003: Visual Identity — App icon, splash screen and Light Clean theme

## Overview

This RFC specifies the visual identity of the Passkey Demo app: application icon, splash screen,
and color token alignment to the **Light Clean** theme. The goal is to replace Expo's default
placeholders with branded assets, ensuring visual consistency between the app's first impression
(launcher, splash) and the UI already implemented in RFC-0002.

## Background & Context

### Current state

RFC-0001 and RFC-0002 are complete. The system works end-to-end. The app UI uses the correct
color palette (`#F8FAFC` bg, `#2563EB` primary, etc.), but all visual identity assets are Expo
SDK defaults:

```
passkeys-app/assets/images/
├── icon.png          ← Expo placeholder (concentric circles, grey background)
├── adaptive-icon.png ← Expo placeholder (same content)
├── splash-icon.png   ← Expo placeholder (same content)
└── favicon.png       ← Expo placeholder (generic 16×16)
```

`app.json` references these assets without a custom background color, resulting in a white splash
with a generic icon on startup.

### Related documents

- `rfcs/completed/RFC-0001-passkeys-poc-completion.md`
- `rfcs/completed/RFC-0002-ux-passkeys-poc.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`

### Glossary

| Term | Definition |
|------|-----------|
| Light Clean | Theme variant with `#F8FAFC` background, `#2563EB` primary, `#0F172A` text |
| Lock Icon | Geometric padlock symbol used as the primary visual identity |
| Adaptive Icon | Android format with separate foreground + background layers (API 26+) |
| Splash backgroundColor | Solid color shown while the JS bundle loads, before Expo's `SplashScreen` |

---

## Problem Statement

The app has no visual identity of its own. On startup, the user sees the Expo default icon in the
launcher and a plain white splash with no branding. This hurts demos because the first impression
does not communicate "secure authentication app" — and any screenshot or demo video exposes the
placeholders. RFC-0002 improved the internal UI; this RFC covers the outer layer.

**If not addressed:** any demo, video, or screenshot will continue to look like a scaffold,
reducing the credibility of the PoC as an implementation reference.

---

## Goals & Non-Goals

### Goals

- Replace `icon.png`, `adaptive-icon.png`, `splash-icon.png`, and `favicon.png` with branded assets
- Configure `app.json` with `backgroundColor` and `splash.backgroundColor` aligned to Light Clean
- Maintain compatibility with Expo SDK 53 and the Android adaptive icon format
- Add no new native dependency
- Modify no TypeScript/React Native source files

### Non-Goals

- iOS icon support (out of scope for this Android PoC)
- Native splash animation via `expo-splash-screen` beyond what already exists
- Commercial product branding or trademarked name
- Building a reusable design system

---

## Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Visual consistency | High | Icon and splash must use the same color tokens as the UI |
| Identity clarity | High | Icon readable at 48 px; communicates authentication/security |
| Expo compatibility | High | Correct dimensions and format for `expo-build-service` |
| Implementation effort | Medium | File replacement, no extra native compilation |
| Demo quality | Medium | Screenshots and videos no longer expose placeholders |

---

## Options Analysis

### Option 1: Geometric padlock (Lock Icon)

**Description:** Minimalist padlock icon with a rounded shackle and rectangular body.
Background `#F8FAFC` (Light Clean), lock in `#2563EB` (primary). Splash with the same icon
centered + "Passkey Demo" below, separated by a subtle divider.

**Pros:**
- Direct metaphor: padlock = secure authentication
- Clear at 32 px (launcher, notifications)
- Identical tokens to those already used in `app/index.tsx` (T.primary, T.bg)
- No complex SVG — simple geometric shapes

**Cons:**
- Padlock is a common icon in security apps (lower uniqueness)

**Scoring:**
| Criterion | Score | Notes |
|-----------|-------|-------|
| Visual consistency | High | Identical tokens to the UI |
| Identity clarity | High | Immediately readable at any size |
| Expo compatibility | High | PNG generated via canvas, no external SVG |
| Implementation effort | High | File replacement only |
| Demo quality | High | Eliminates placeholders |

**Effort:** Low — PNG generation + `app.json` edit.
**Risk:** Low. No native code changes.

---

### Option 2: Fingerprint (Biometric rings)

**Description:** Concentric arcs with a bottom gap (whorl pattern), representing biometrics.
Dark background (`#080D1A`), rings in cyan (`#38BDF8`). More technical/dark aesthetic.

**Pros:**
- Direct reference to WebAuthn biometrics
- Distinctive and modern look

**Cons:**
- Inverted contrast: dark icon does not match the app's Light Clean UI
- May look generic (concentric rings are Expo's own placeholder)

**Scoring:**
| Criterion | Score | Notes |
|-----------|-------|-------|
| Visual consistency | Medium | Opposite contrast to the internal UI |
| Identity clarity | High | Biometrics are recognizable |
| Expo compatibility | High | — |
| Implementation effort | High | — |
| Demo quality | Medium | Visual misalignment with the app |

**Effort:** Low.
**Risk:** Low, but visually inconsistent with the Light Clean theme.

---

## Recommendation

**Option 1: Geometric padlock (Lock Icon)**

Aligns with the UI validated in RFC-0002, uses the same tokens, and communicates secure
authentication without relying on a biometric metaphor that visually conflicts with the light theme.

> **Note:** The implemented assets use the fingerprint biometric design (Option 2) with the
> Light Clean palette (`#F8FAFC` bg, `#2563EB` primary), which was the final choice made during
> the design iteration in `Passkey Icon Design.html`. The lock icon appears on the in-app
> `SplashScreen` component (React Native layer), while the native splash uses the fingerprint icon.

---

## Technical Design

### Color tokens

Identical to the token map already in use in `app/index.tsx` and `app/home.tsx`:

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#F8FAFC` | Icon background, splash background |
| `surface` | `#FFFFFF` | Card backgrounds |
| `primary` | `#2563EB` | Lock/fingerprint, outlines, accent |
| `text` | `#0F172A` | Title on splash |
| `textSecondary` | `#475569` | Tagline on splash |
| `border` | `#E2E8F0` | Divider line on splash |

### Icon specification

```
Shape: biometric fingerprint rings (whorl pattern)
  Rings:    9 concentric arcs, r = 6..62 px (at 200px canvas scale)
  Gap:      bottom opening, grows from 0° to 70° on outer rings
  Color:    #2563EB (stroke), glow shadow same color
  Stroke:   2.2 × scale px, lineCap round
  Background: #F8FAFC (fill)

Files to generate (PNG):
  icon.png           1024×1024 px   rounded corners radius 22% (iOS-safe)
  adaptive-icon.png  1024×1024 px   no corners (Android clips via mask)
  splash-icon.png     200×200 px    no corners
  favicon.png          32×32 px     no corners
```

### Splash screen specification

```
Dimensions: device viewport (managed by Expo)
Background: #F8FAFC  (splash.backgroundColor in app.json)
Content:
  [icon]      splash-icon.png centered (200×200, resizeMode: contain)
  [divider]   horizontal line 1 px, color #E2E8F0, width 48 px
  [title]     "Passkey Demo" — DM Sans 700, 20 px, #0F172A
  [tagline]   "PASSWORDLESS · SECURE" — DM Mono 400, 11 px, #2563EB, letter-spacing 0.12em

Layout: flex column, align center, justify center; title never overlaps the icon
```

### `app.json` changes

```jsonc
{
  "expo": {
    "name": "Passkey Demo",
    "icon": "./assets/images/icon.png",
    "backgroundColor": "#F8FAFC",          // ← add
    "plugins": [
      ["expo-splash-screen", {
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 200,
        "resizeMode": "contain",
        "backgroundColor": "#F8FAFC"       // ← update (was "#ffffff")
      }]
    ],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#F8FAFC"       // ← update (was "#FFFFFF")
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

> **Note:** `splash.image` points to `splash-icon.png` (200×200). Expo centers and scales it
> over `backgroundColor` according to `resizeMode`.

### PNG generation

Assets are generated via a Node.js canvas script (`/tmp/gen-icons/generate.js`) using the
`canvas` npm package. The design reference is `Passkey Icon Design.html` (Light Clean variant).

To regenerate:
```bash
cd /tmp/gen-icons
node generate.js /path/to/passkeys-app/assets/images/
```

### Verification

After replacing the files:

```bash
cd passkeys-app
npx expo run:android
# Check:
# 1. Launcher icon shows blue fingerprint on light background
# 2. Splash shows #F8FAFC background (no white/black flash)
# 3. Internal app layout unchanged (no UI regression)
```

---

## Implementation Plan

### Phase 1 — Asset generation and replacement

| Step | File(s) | Description |
|------|---------|-------------|
| 1.1 | `passkeys-app/assets/images/icon.png` | Replace with Light Clean export 1024×1024 |
| 1.2 | `passkeys-app/assets/images/adaptive-icon.png` | Replace with Light Clean export 1024×1024 |
| 1.3 | `passkeys-app/assets/images/splash-icon.png` | Replace with Light Clean export 200×200 |
| 1.4 | `passkeys-app/assets/images/favicon.png` | Replace with Light Clean export 32×32 |

**Task file:** `tasks/rfc-0003/phase-1-assets.md`
**Completion criterion:** four PNG files replaced, no extra files created.

### Phase 2 — `app.json` configuration

| Step | File(s) | Description |
|------|---------|-------------|
| 2.1 | `passkeys-app/app.json` | Add `backgroundColor: "#F8FAFC"` at root |
| 2.2 | `passkeys-app/app.json` | Update splash plugin `backgroundColor` to `"#F8FAFC"` |
| 2.3 | `passkeys-app/app.json` | Update `android.adaptiveIcon.backgroundColor` to `"#F8FAFC"` |

**Task file:** `tasks/rfc-0003/phase-2-appjson.md`
**Completion criterion:** `app.json` valid JSON with all three fields updated.

### Phase 3 — Emulator validation

| Step | File(s) | Description |
|------|---------|-------------|
| 3.1 | — | `npx expo run:android` on API 34+ emulator |
| 3.2 | — | Confirm launcher icon shows branded icon |
| 3.3 | — | Confirm splash background and no flash |
| 3.4 | — | Confirm register → home → logout flow (no regression) |
| 3.5 | `tasks/rfc-0003/phase-3-validation.md` | Record evidence (checklist above) |

**Task file:** `tasks/rfc-0003/phase-3-validation.md`
**Completion criterion:** all four validation items marked `[x]`.

### Phase 4 — Documentation

Fixed scope:
- Move this RFC to `rfcs/completed/RFC-0003-visual-identity.md`
- Fill in `## Decision Record` below
- Update `passkeys-app/README.md` if the setup section mentions icon or splash

**Completion criterion:** RFC in `completed/` with Decision Record filled in.

### Rollback

Rollback is a file replacement:
- Restore the four original Expo PNGs (available in any `npx create-expo-app` scaffold)
- Revert `app.json` to original values (remove explicit `backgroundColor`)

No TypeScript changes, no impact on tests or lint.

---

## Open Questions

1. **`splash.image` vs `splash-icon.png`:** confirm whether Expo SDK 53 renders better with
   the icon at 200×200 (`contain`) or at higher resolution with `resizeMode: "cover"`.
2. **Dark mode:** Android may display the adaptive icon on a dark background in some launchers.
   Confirm whether `backgroundColor: "#F8FAFC"` is sufficient or if a `monochrome` icon layer
   (API 33+) is needed.
3. **EAS Build:** confirm that canvas-exported PNGs (no alpha on background) are accepted by
   the `eas build` pipeline without additional pre-processing.

---

## Decision Record

_(to be filled after approval and implementation)_

- **Date:** —
- **Decision:** —
- **Verified deliverables:** —
- **Open questions resolved:** —
- **Out of scope (confirmed):** —
