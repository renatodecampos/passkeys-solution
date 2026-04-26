# RFC-0004 Keystore Binding PoC — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing keystore binding infrastructure into two observable end-to-end scenarios: healthy (binding ok → access granted) and suspicious (binding lost after new fingerprint → access blocked with clear message).

**Architecture:** The Android Keystore key created at registration has `setInvalidatedByBiometricEnrollment(true)`. When a new fingerprint is added the key is destroyed by the OS. On sign-in the client reports `status: "lost"` instead of a valid signature. The server evaluates this via `evaluateBinding()` and the `authDenyOnBindingLost` policy flag. The missing wire is: (a) the server does not yet expose a `suspiciousActivity` boolean in the response, and (b) the app navigates to home regardless of the outcome.

**Tech Stack:** TypeScript/Fastify (server), React Native/Expo (app), Jest (server tests), Android Kotlin (native module — no changes needed)

---

### Task 1: Server tests — assert suspiciousActivity in policy denial path

**Files:**
- Modify: `passkeys-server/src/authentication/__tests__/binding-policy.test.ts`

- [ ] **Step 1: Add suspiciousActivity assertion to the existing test**

Open [passkeys-server/src/authentication/__tests__/binding-policy.test.ts](passkeys-server/src/authentication/__tests__/binding-policy.test.ts) and add the assertion `expect(result.suspiciousActivity).toBe(true)` to the existing test at line 90:

```typescript
    expect(result.verified).toBe(false);
    expect(result.biometryBindingStatus).toBe('lost');
    expect(result.suspiciousActivity).toBe(true);   // ← add this line
    expect(mockUpdateUser).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run the test — verify it FAILS**

```bash
cd passkeys-server && npx jest --testPathPatterns=binding-policy --no-coverage 2>&1 | tail -20
```

Expected: `expect(received).toBe(expected)` — `suspiciousActivity` is `undefined`, not `true`.

---

### Task 2: Server — add suspiciousActivity to VerifyAuthResult and all return points

**Files:**
- Modify: `passkeys-server/src/authentication/index.ts`

- [ ] **Step 1: Add suspiciousActivity to VerifyAuthResult type**

In [passkeys-server/src/authentication/index.ts](passkeys-server/src/authentication/index.ts), replace lines 27–32:

```typescript
export type VerifyAuthResult = {
    verified: boolean;
    authAttemptId: string;
    biometryBindingStatus: string;
    verification: VerifiedAuthenticationResponse;
};
```

with:

```typescript
export type VerifyAuthResult = {
    verified: boolean;
    authAttemptId: string;
    biometryBindingStatus: string;
    suspiciousActivity: boolean;
    verification: VerifiedAuthenticationResponse;
};
```

- [ ] **Step 2: Add suspiciousActivity: false to the webauthn-not-verified early return**

Find the block at lines 231–249 (the `if (!verified || !authenticationInfo)` guard) and add the field:

```typescript
        return {
            verified: false,
            authAttemptId: _id.toHexString(),
            biometryBindingStatus: toBiometryBindingStatus("skipped"),
            suspiciousActivity: false,
            verification,
        };
```

- [ ] **Step 3: Add suspiciousActivity: true to the policyDenied return**

Find the block at lines 260–279 (the `if (policyDenied)` branch) and set the flag to `true`:

```typescript
        return {
            verified: false,
            authAttemptId: _id.toHexString(),
            biometryBindingStatus: toBiometryBindingStatus("lost"),
            suspiciousActivity: true,
            verification,
        };
```

- [ ] **Step 4: Add suspiciousActivity: false to the success return**

Find the final return block at lines 281–302 and add:

```typescript
    return {
        verified: true,
        authAttemptId: _id.toHexString(),
        biometryBindingStatus: toBiometryBindingStatus(bindingEval.outcome),
        suspiciousActivity: false,
        verification,
    };
```

- [ ] **Step 5: Run the binding-policy test — verify it PASSES**

```bash
cd passkeys-server && npx jest --testPathPatterns=binding-policy --no-coverage 2>&1 | tail -10
```

Expected: `PASS src/authentication/__tests__/binding-policy.test.ts`

- [ ] **Step 6: Run all server tests — verify no regressions**

```bash
cd passkeys-server && npm test 2>&1 | tail -20
```

Expected: all suites pass, coverage ≥ 80%.

- [ ] **Step 7: Commit**

```bash
cd passkeys-server && git add src/authentication/index.ts src/authentication/__tests__/binding-policy.test.ts
git commit -m "feat(auth): add suspiciousActivity flag to VerifyAuthResult

Set suspiciousActivity=true when authDenyOnBindingLost policy denies
access due to binding_lost outcome. Covers the keystore enrollment-
change detection scenario (RFC-0004).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Server API — expose suspiciousActivity in the HTTP response

**Files:**
- Modify: `passkeys-server/src/infra/api/index.ts`

- [ ] **Step 1: Add suspiciousActivity to /verify-authentication reply**

In [passkeys-server/src/infra/api/index.ts](passkeys-server/src/infra/api/index.ts), find the `reply.send(...)` call inside the `/verify-authentication` handler (around line 146) and add the field:

```typescript
            reply.send({
                verified: result.verified,
                authAttemptId: result.authAttemptId,
                biometryBindingStatus: result.biometryBindingStatus,
                suspiciousActivity: result.suspiciousActivity,
            });
```

- [ ] **Step 2: Run all server tests — no regressions**

```bash
cd passkeys-server && npm test 2>&1 | tail -10
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
cd passkeys-server && git add src/infra/api/index.ts
git commit -m "feat(api): expose suspiciousActivity in verify-authentication response (RFC-0004)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Server config — enable deny policy in .env-example

**Files:**
- Modify: `passkeys-server/.env-example`

- [ ] **Step 1: Set AUTH_DENY_ON_BINDING_LOST=true**

In [passkeys-server/.env-example](passkeys-server/.env-example), change:

```
AUTH_DENY_ON_BINDING_LOST=false
```

to:

```
AUTH_DENY_ON_BINDING_LOST=true
```

This enables the blocking policy for the PoC. The comment above it already describes the flag. No code changes needed.

> **Note for manual setup:** if you already have a `.env` file, update it there too — `.env-example` is only a template.

- [ ] **Step 2: Commit**

```bash
git add passkeys-server/.env-example
git commit -m "chore(config): enable AUTH_DENY_ON_BINDING_LOST=true for RFC-0004 PoC

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: App — block navigation to home when suspiciousActivity

**Files:**
- Modify: `passkeys-app/app/index.tsx`

- [ ] **Step 1: Widen verifyResult type and add suspicious guard in runLogin()**

In [passkeys-app/app/index.tsx](passkeys-app/app/index.tsx), find this block inside `runLogin()` (around lines 263–282):

```typescript
      const verifyResult = (await verifyAuthentication(
        username.trim(),
        passkeyResponse,
        verifyExtras
      )) as { verified?: boolean; biometryBindingStatus?: string };
      setTone('success');
      setMessage('Passkey verified by server.');
      if (typeof __DEV__ !== 'undefined' && __DEV__ && verifyResult.biometryBindingStatus) {
        console.log('[keystore] biometryBindingStatus', verifyResult.biometryBindingStatus);
      }
      router.replace({
```

Replace it with:

```typescript
      const verifyResult = (await verifyAuthentication(
        username.trim(),
        passkeyResponse,
        verifyExtras
      )) as { verified?: boolean; biometryBindingStatus?: string; suspiciousActivity?: boolean };
      if (typeof __DEV__ !== 'undefined' && __DEV__ && verifyResult.biometryBindingStatus) {
        console.log('[keystore] biometryBindingStatus', verifyResult.biometryBindingStatus);
      }
      if (verifyResult.suspiciousActivity === true) {
        setTone('error');
        setMessage(
          'Access blocked: a new biometric was registered on this device since enrollment. ' +
          'If this was not you, your account may be at risk.'
        );
        return;
      }
      setTone('success');
      setMessage('Passkey verified by server.');
      router.replace({
```

- [ ] **Step 2: Commit**

```bash
cd passkeys-app && git add app/index.tsx
git commit -m "feat(app): block navigation when server reports suspicious keystore activity (RFC-0004)

When binding_lost is detected and the server sets suspiciousActivity=true,
show an error message on the sign-in screen instead of navigating to home.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: App home screen — color-coded binding status badge

**Files:**
- Modify: `passkeys-app/app/home.tsx`

- [ ] **Step 1: Replace plain binding text with color-coded label**

In [passkeys-app/app/home.tsx](passkeys-app/app/home.tsx), find the `biometryBinding` row (around lines 63–68):

```typescript
          {biometryBinding ? (
            <View style={styles.row}>
              <Text style={styles.k}>binding (PoC)</Text>
              <Text style={styles.v}>{biometryBinding}</Text>
            </View>
          ) : null}
```

Replace with:

```typescript
          {biometryBinding ? (
            <View style={styles.row}>
              <Text style={styles.k}>binding (PoC)</Text>
              <Text
                style={[
                  styles.v,
                  biometryBinding === 'ok' && { color: T.success },
                  biometryBinding === 'lost' && { color: T.error },
                ]}
              >
                {biometryBinding === 'ok'
                  ? 'ok — keystore intact'
                  : biometryBinding === 'not_present'
                  ? 'not present'
                  : biometryBinding}
              </Text>
            </View>
          ) : null}
```

- [ ] **Step 2: Commit**

```bash
cd passkeys-app && git add app/home.tsx
git commit -m "feat(home): color-code keystore binding status badge (RFC-0004)

Green for ok, default for not_present, red for lost.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

### Spec coverage

| Scenario | Covered by |
|---|---|
| Healthy: binding ok → access granted, status green on home | Tasks 2, 3, 6 |
| Suspicious: new fingerprint added → binding lost → access blocked | Tasks 1, 2, 3, 4, 5 |
| Server returns `suspiciousActivity: true` | Tasks 1, 2, 3 |
| App shows error instead of navigating | Task 5 |
| Home screen shows green `ok — keystore intact` | Task 6 |
| Policy enable via env var | Task 4 |

### Placeholder scan — none found.

### Type consistency

- `VerifyAuthResult.suspiciousActivity` defined in Task 2, Step 1; used in Task 2 Steps 2–4; exposed in Task 3 Step 1; consumed in Task 5 Step 1. Consistent across all tasks.
- `verifyResult.suspiciousActivity` in the app is typed as `boolean | undefined` — guard uses `=== true`, safe for `undefined`.
