---
rfc_id: RFC-0003
title: Visual Identity — App icon, splash screen and Light Clean theme
status: COMPLETED
author: Renato de Campos
reviewers: []
created: 2026-04-25
last_updated: 2026-04-25
decision_date: 2026-04-25
---

# RFC-0003: Visual Identity — App icon, splash screen and Light Clean theme

## Overview

This RFC specifies the visual identity of the Passkey Demo app: application icon, splash screen,
and color token alignment to the **Light Clean** theme. The goal is to replace Expo's default
placeholders with branded assets, ensuring visual consistency between the app's first impression
(launcher, splash) and the UI already implemented in RFC-0002.

**Android (native splash):** this RFC **explicitly** includes **`assets/images/splash-android.png`**
as the art used for the **Android** native splash when the `expo-splash-screen` config sets
`android.image` to that file (in addition to the default **`splash-icon.png`** for the top-level
plugin `image` and for non-Android / fallback). Without that `android` key, Android builds
still generate native splash from `splash-icon.png` only.

## Background & Context

### Current state

RFC-0001 and RFC-0002 are complete. The system works end-to-end. The app UI uses the correct
color palette (`#F8FAFC` bg, `#2563EB` primary, etc.), but all visual identity assets are Expo
SDK defaults:

```
passkeys-app/assets/images/
├── icon.png            ← Expo placeholder (concentric circles, grey background)
├── adaptive-icon.png   ← Expo placeholder (same content)
├── splash-icon.png     ← Default splash art (Expo; used as plugin default / non-Android)
├── splash-android.png  ← (Optional but recommended for this PoC) Android-only native splash art
└── favicon.png         ← Expo placeholder (generic 16×16)
```

`splash-android.png` is **not** a substitute for `splash-icon.png` in the config **unless** the
`expo-splash-screen` plugin is given an `android` override (see Technical Design). Without that
key, the native Android splash is generated from whatever `image` the plugin has at the top
level (historically `splash-icon.png` only).

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
| `splash-android.png` | **Android native splash** art used when the `expo-splash-screen` plugin’s `android.image` points to this file; distinct from the default `splash-icon.png` (see Technical Design) |

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
- Provide **`splash-android.png`** for the **Android** native splash (see plugin `android` key) when a different composition from the 200×200 `splash-icon` is required (e.g. portrait canvas)
- Configure `app.json` with `backgroundColor` and the splash plugin `backgroundColor` aligned to Light Clean
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
  icon.png            1024×1024 px   rounded corners radius 22% (iOS-safe)
  adaptive-icon.png   1024×1024 px   no corners (Android clips via mask)
  splash-icon.png       200×200 px   no corners; default `image` in `expo-splash-screen`
  favicon.png            32×32 px   no corners
  splash-android.png   1080×1920 px  optional; used only for Android native splash via plugin `android.image`
    (portrait “hero” or full composition; prebuild composes it into density drawables; see below)
```

### Android native splash: `splash-android.png` and the plugin `android` key

**Why a separate file:** the default plugin `image` (typically `splash-icon.png` at 200×200) is
used for the **default** config that Expo merges into Android **unless** a platform-specific
object is set. The PoC also ships **`splash-android.png`**, a **portrait** asset (e.g. 1080×1920)
with branding tuned for the Android 12+ splash pipeline (background color + centered artwork
generated by prebuild). That requires an **explicit** override in `app.json`:

- Under `["expo-splash-screen", { ... }]`, set **`"android": { "image": "./assets/images/splash-android.png", ... }`**
  so the Android native `res/drawable-*/splashscreen_logo.png` files are **not** built from
  `splash-icon.png` alone.

**Parameters (recommended in this PoC):**

- `image`: `./assets/images/splash-android.png`
- `imageWidth`: `288` — aligns with the **288dp** square canvas the Expo prebuild uses when
  compositing the splash image (default `200` is tuned for a small center logo, not a large artboard).
- `resizeMode`: `contain` (or adjust per visual QA).

**Regeneration after any `app.json` or splash-asset change:** run `npx expo prebuild --platform android`
so `android/.../colors.xml`, `splashscreen_*` drawables, and mipmaps stay in sync. Changing only
`app.json` without prebuild can leave a stale `android/` tree (white splash, wrong bitmap).

**Platform limits:** On Android 12+, the system splash is still **background color** + **centered
drawable**; it is not a full-bleed video. Very tall art may be letterboxed inside the generated
square; design the PNG accordingly or accept bars on the sides.

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
    "backgroundColor": "#F8FAFC",
    "plugins": [
      ["expo-splash-screen", {
        "image": "./assets/images/splash-icon.png",   // default (web / fallback / iOS prebuild)
        "imageWidth": 200,
        "resizeMode": "contain",
        "backgroundColor": "#F8FAFC",
        "android": {                                   // required to use splash-android.png on Android
          "image": "./assets/images/splash-android.png",
          "imageWidth": 288,
          "resizeMode": "contain"
        }
      }]
    ],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#F8FAFC"
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

> **Notes**
> - The top-level plugin `image` remains **`splash-icon.png`** (200×200) for consistency with
>   the original spec, Expo docs, and non-Android targets.
> - **`android.image`** is **`splash-android.png`**: without this nested object, Android native
>   resources are generated from `splash-icon.png` only, and the dedicated Android asset is ignored.
> - After editing this block, run **`npx expo prebuild --platform android`** (or a full
>   `npx expo run:android` that applies prebuild) so `android/app/src/main/res/…` is updated.

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
# 2. Native splash: #F8FAFC background, artwork matches splash-android (after prebuild), no wrong flash
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
| 1.5 | `passkeys-app/assets/images/splash-android.png` | Android native splash (e.g. 1080×1920) — **branded, distinct** from a simple upscale of 1.3; required if phase 2 sets `expo-splash-screen` `android.image` to this path |

**Task file:** `tasks/rfc-0003/fase-1-assets.md` (on-disk name; older RFC text may say `phase-1-assets.md`)
**Completion criterion:** steps 1.1–1.4 done; 1.5 done **if** the project uses a dedicated Android splash (recommended for this PoC).

### Phase 2 — `app.json` configuration

| Step | File(s) | Description |
|------|---------|-------------|
| 2.1 | `passkeys-app/app.json` | Add `expo.backgroundColor: "#F8FAFC"` |
| 2.2 | `passkeys-app/app.json` | `expo-splash-screen` plugin: `backgroundColor: "#F8FAFC"` |
| 2.3 | `passkeys-app/app.json` | `expo.android.adaptiveIcon.backgroundColor: "#F8FAFC"` |
| 2.4 | `passkeys-app/app.json` | `expo-splash-screen` plugin: **`"android": { "image": "./assets/images/splash-android.png", "imageWidth": 288, "resizeMode": "contain" }`** so Android uses `splash-android.png` (keeps top-level `"image": "./assets/images/splash-icon.png"`) |
| 2.5 | `passkeys-app/` | Run `npx expo prebuild --platform android` and verify `android/.../values/colors.xml` matches Light Clean; confirm drawables regen |

**Task file:** `tasks/rfc-0003/fase-2-appjson.md`
**Completion criterion:** `app.json` valid JSON; steps 2.1–2.3 + **2.4** as above; 2.5 executed when `android/` is in-repo.

### Phase 3 — Emulator validation

| Step | File(s) | Description |
|------|---------|-------------|
| 3.1 | — | `npx expo run:android` on API 34+ emulator |
| 3.2 | — | Confirm launcher icon shows branded icon |
| 3.3 | — | Confirm splash background and no flash |
| 3.4 | — | Confirm register → home → logout flow (no regression) |
| 3.5 | `tasks/rfc-0003/fase-3-validacao.md` | Record evidence (checklist above); on-device confirm **Android** uses expected splash (incl. `splash-android` after prebuild) |

**Task file:** `tasks/rfc-0003/fase-3-validacao.md`
**Completion criterion:** all four validation items marked `[x]`.

### Phase 4 — Documentation

**Done (2026-04-25).** Scope that was executed:
- RFC lives at `rfcs/completed/RFC-0003-visual-identity.md` with `## Decision Record` filled
- `passkeys-app/README.md` updated with an **Icon and splash (RFC-0003)** note (and prebuild reminder)

**Task file:** `tasks/rfc-0003/fase-4-documentacao.md`  
**Completion criterion:** (met) RFC in `completed/` with Decision Record filled in; app README points maintainers to assets + prebuild.

### Rollback

Rollback is a file replacement and config revert:
- Restore the **four** (or **five** if `splash-android.png` was added) original Expo / prior PNGs
- Revert `app.json` to original values, including **removing** the `expo-splash-screen` `android` block if that was added
- Re-run **`npx expo prebuild --platform android`** after reverting, or delete regenerated splash drawables, so `android/` does not point at reverted assets

No TypeScript changes in the original scope; no impact on server tests. App-only Jest may still pass.

---

## Open Questions

1. **Default `splash.image` (200×200) vs `android.image` + `imageWidth: 288`:** the RFC **locks**
   the Android-specific override to `splash-android.png` with `imageWidth: 288` for the prebuild
   square; the default 200×200 `splash-icon.png` remains the plugin’s top-level `image`. Further
   tuning (e.g. `cover`) is a visual QA follow-up, not a blocker to the spec.
2. **Dark mode:** Android may display the adaptive icon on a dark background in some launchers.
   Confirm whether `backgroundColor: "#F8FAFC"` is sufficient or if a `monochrome` icon layer
   (API 33+) is needed.
3. **EAS Build:** confirm that canvas-exported PNGs (no alpha on background) are accepted by
   the `eas build` pipeline without additional pre-processing.

---

## Decision Record

- **Date:** 2026-04-25
- **Decision:** **Accepted.** Ship branded PNGs (Light Clean palette) and `app.json` alignment per Technical Design. Final art uses the **fingerprint (biometric rings)** on `#F8FAFC` for launcher, adaptive, native splash, and favicon — the recommendation section’s Option 1 (padlock) remains the written default for metaphor; implementation followed the design iteration note (fingerprint + Light Clean) for outer-shell consistency with RFC-0002.
- **Verified deliverables:** `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png`, `splash-android.png` under `passkeys-app/assets/images/`; `expo.backgroundColor` and `expo-splash-screen` (including `android.image` for `splash-android.png`, `imageWidth` 288); `android.adaptiveIcon.backgroundColor` `#F8FAFC`; `npx expo prebuild --platform android` applied so `android/…/colors.xml` and drawables match; `npm test` in `passkeys-app` passing; device validation recorded in `tasks/rfc-0003/fase-3-validacao.md`.
- **Open questions resolved:** (1) Android override uses `splash-android.png` + `imageWidth` 288 as specified — further `resizeMode` tuning is follow-up. (2) Light Clean `backgroundColor` for adaptive icon adopted; **monochrome** layer / API 33+ not implemented — optional follow-up. (3) **EAS Build** not verified in this PoC; canvas-exported PNGs are standard RGBA/PNG and expected to work.
- **Out of scope (confirmed):** iOS icon pack, animated native splash, commercial naming, shared design system — unchanged from Non-Goals.
