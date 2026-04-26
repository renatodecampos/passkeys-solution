# RFC-0004 Phase 2 — manual PoC checklist (fill & commit after running)

| Field | |
| --- | --- |
| **Date (UTC / local)** | |
| **Emulator: API level & image** | (e.g. API 35 Google APIs x86_64) |
| **Emulator only — real-device validity** | Out of band for this run (see RFC *PoC limitations*). |

## Steps (Android)

- [ ] `adb reverse tcp:3000 tcp:3000` (if using localhost server)
- [ ] Register passkey → authenticate → check MongoDB `auth_attempts` for `bindingOutcome` = `ok` (or as server returns) after first successful sign-in with binding
- [ ] Settings → add fingerprint (or new biometric enrollment) → authenticate again
- [ ] If new `auth_attempts` row shows `bindingOutcome` = `lost` (or `error` as per server policy) — note as **H1 positive** for this **API / image** row; if not — document **inconclusive / negative** (OEM variance, RFC *PoC limitations*)

## Optional (Open Q8)

- [ ] If enrollment was changed by a labeled step (e.g. script or explicit “Settings → Security → Fingerprint” note in lab log), add one line here: 

## Notes

_Redis/Mongo redacted excerpts optional._

## Outcome (for this matrix row)

- [ ] H1 observed (lost after enrollment change)
- [ ] H1 not observed (document API/image; not a “green” PoC without this note)
- [ ] Inconclusive (explain)
