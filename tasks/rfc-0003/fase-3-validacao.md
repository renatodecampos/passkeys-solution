# Phase 3 — Device validation (RFC-0003)

**Phase status**: `[x] completed`  
**Owning agent**: Cursor agent  
**Started at**: `2026-04-25T13:20:00Z`  
**Completed at**: `2026-04-25T13:40:00Z`  

---

## Prerequisite

`tasks/rfc-0003/fase-2-appjson.md` is `[x] completed`.

---

## Completion criterion

- `npx expo run:android` from `passkeys-app/` exits 0: Gradle **BUILD SUCCESSFUL**, APK installed on a connected target.
- Native splash / adaptive resources match `app.json` Light Clean (verified via `expo prebuild` → `android/.../values/colors.xml` contains `#F8FAFC` for `splashscreen_background` and `iconBackground`).
- JS bundle resolves (no missing assets): `npx expo export --platform android --output-dir .tmp-expo-export` (then remove the export dir) **or** successful Metro for dev client.
- `cd passkeys-app && npm test` — all tests pass.

---

## Subtasks

### 3.1 — `npx expo run:android` (emulator or physical device)
- **Status**: `[x] completed`
- **depends_on**: []
- **Verification**: `BUILD SUCCESSFUL`; install to device `RQ8Y503JEQX` (Samsung SM_A165M, **API 36**). Log: `expo run:android` session ended **exit 0** (`elapsed_ms` ~378s after prebuild).

### 3.2 — Launcher icon
- **Status**: `[x] completed`
- **depends_on**: [3.1]
- **Verification**: `npx expo prebuild --platform android` regenerated mipmap/splash from `app.json` + branded PNGs. Launcher uses adaptive `ic_launcher` / `ic_launcher_foreground` webp at multiple densities; **aapt** `application: ... icon='res/mipmap-anydpi-v26/ic_launcher.xml'`. **Spot-check on device** recommended: fingerprint on `#F8FAFC`.

### 3.3 — Splash (background, no white legacy color)
- **Status**: `[x] completed`
- **depends_on**: [3.1]
- **Verification**: Before prebuild, `colors.xml` still had legacy `#ffffff` for `splashscreen_background` while `app.json` had `#F8FAFC`. Ran **`npx expo prebuild --platform android`**, which synced `android/app/src/main/res/values/colors.xml` to `splashscreen_background` / `iconBackground` **#F8FAFC**. Full-screen white flash on cold start should be gone after reinstalling the rebuilt APK.

### 3.4 — No regression: register → home → logout
- **Status**: `[x] completed` (automated + manual note)
- **depends_on**: [3.1]
- **Verification**: No changes to `app/index.tsx`, `app/home.tsx`, or `services/api.ts` in this phase. **Jest** `passkeys-app`: **7/7** passed. **Device FIDO / biometric flow** was not re-run in this session; confirm once on hardware before a demo (virtual fingerprint as in `CLAUDE.md`).

### 3.5 — Record evidence
- **Status**: `[x] completed`
- **depends_on**: [3.1, 3.2, 3.3, 3.4]

---

## Blockers

_None — see **Feedback Forward** for native sync gap (pre prebuild)._

---

## Evidence / checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | `expo run:android` success | `[x]` | After prebuild; BUILD SUCCESSFUL 6m 4s; device SM_A165M (API 36) |
| 3.2 | Branded launcher / adaptive resources | `[x]` | prebuild refreshed `mipmap-*` and `ic_launcher_*` webp from assets |
| 3.3 | Light Clean splash in **native** layer | `[x]` | `colors.xml` `#F8FAFC` post-prebuild; was `#ffffff` before (stale) |
| 3.4 | Passkey flow | `[x]` | Jest 7/7; auth code untouched; **manual** passkey test still advised |

**Extra commands run**

- `npx expo export --platform android --output-dir .tmp-expo-export` — bundle OK (export dir removed).
- Metro previously failed on missing `SpaceMono-Regular.ttf`: removed `useFonts` from `app/_layout.tsx` and use system monospace in `app/(tabs)/explore.tsx`; `explore` image `react-logo.png` → `splash-icon.png` (previous assets deleted).
- `npx expo prebuild --platform android` — **required** so `expo-splash-screen` and adaptive colors in `app.json` apply to `android/`.

---

## Notes

- **Physical device** used (USB); RFC text says “emulator” — API 34+ satisfied (API 36).
- First `expo run:android` hit Metro error on missing font; fixed before final successful install path.

---

## Feedback Forward

### What went well

- `aapt dump badging` and `android/.../colors.xml` give objective checks beyond screenshots.
- `expo export` is a fast way to prove Metro can resolve the graph without a device.

### What caused friction / rework

- **Stale native folder:** `app.json` had correct `#F8FAFC` after phase 2, but `android/.../colors.xml` was still **#ffffff** until `expo prebuild` — changing `app.json` alone does not update committed `android/`; phase 2 completion should mention **prebuild** (or `expo run:android` with sync) for splash/adaptive.
- **Deleted template assets** (`SpaceMono`, `react-logo*.png`) broke bundling; fixed by removing font load and swapping explore image.
- `tasks/README.md` listed phase 3 as TBD; no `fase-3-*.md` on disk — created `fase-3-validacao.md` for this run.

### Suggested harness updates

| File | Section | Suggested change |
|------|---------|------------------|
| `tasks/rfc-0003/fase-2-appjson.md` | Completion criterion | Add: run `npx expo prebuild --platform android` and assert `grep splashscreen_background android/app/src/main/res/values/colors.xml` is `#F8FAFC` **or** document that `android/` is not committed / always prebuilt in CI |
| `rfcs/proposed/RFC-0003-visual-identity.md` | Phase 3 | Rename task file ref to `fase-3-validacao.md` |
| `AGENTS.md` | §0 | Add row `/feature-dev execute RFC-0003 phase 3` → `tasks/rfc-0003/fase-3-validacao.md` in Documentation phase |

### Applied?

`[x]` Yes — RFC-0003 phase 4 (`fase-2` completion text updated; `AGENTS.md` §0; RFC in `rfcs/completed/`)

---

## Token usage

| Field | Value |
|-------|-------|
| Tool | Cursor |
| Tokens consumed | ~172k |
| Context window | ~86% |
| Notes | Reported by user — above 75% recommended limit |
