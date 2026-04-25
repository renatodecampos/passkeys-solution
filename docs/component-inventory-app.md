# UI route / screen inventory — passkeys-app

*Quick scan — file-based routes under `app/`, no deep component library audit.*

| File | Role |
|------|------|
| `_layout.tsx` | Root stack / theme |
| `index.tsx` | Primary entry: passkey register & sign in |
| `home.tsx` | Authenticated “Home Proof” |
| `+not-found.tsx` | 404 |
| `second.tsx` | Secondary screen (as named in repo) |
| `(tabs)/_layout.tsx` | Tab navigator layout |
| `(tabs)/index.tsx` | Tab home (harness: not primary post-login for passkey flow) |
| `(tabs)/explore.tsx` | Sample / explore tab |

*Design system: Expo + React Native primitives and `@expo/vector-icons` — no separate design-system package in `package.json` beyond Expo stack.*

*Deep scan would enumerate shared UI fragments and style patterns.*
