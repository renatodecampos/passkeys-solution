import { randomBytes } from "node:crypto";
import { rpID, expectedOrigins, authDenyOnBindingLost, authDenyOnBindingPinUnlock, bindingChallengeTtlSeconds, authRateLimitMax } from "../setup"
import { getUser, updateUser, insertAuthAttempt, getKeystoreBindingByUserId } from "../infra/database/database";
import { AuthenticationResponseJSON, GenerateAuthenticationOptionsOpts, generateAuthenticationOptions, VerifiedAuthenticationResponse, verifyAuthenticationResponse, VerifyAuthenticationResponseOpts, WebAuthnCredential } from "@simplewebauthn/server";
import { redis } from "../infra/database/redis";
import { logger } from "../infra/logger";
import { AUTH_AUDIT_SCHEMA_VERSION, BindingOutcome } from "../types/auth-audit";
import { verifySpkiBindingSignature } from "./binding-crypto";

const challengeKey = (username: string) => `challenge:${username}-authentication`;
export const bindingChallengeRedisKey = (username: string) =>
    `webauthn-binding-challenge:${username}`;
const rateLimitKey = (userId: string) => `auth-ratelimit:${userId}`;

export type ClientBindingPayload = {
    challenge?: string;
    signature?: string;
    /** ES256 = P-256; EdDSA = Ed25519 for this PoC */
    algorithm?: string;
    status?: "lost";
};

export type VerifyAuthenticationBody = AuthenticationResponseJSON & {
    binding?: ClientBindingPayload;
    bindingUnlockHint?: "biometric" | "device_credential" | null;
};

export type VerifyAuthResult = {
    verified: boolean;
    authAttemptId: string;
    biometryBindingStatus: string;
    suspiciousActivity: boolean;
    blockReason?: "binding_lost" | "pin_unlock";
    verification: VerifiedAuthenticationResponse;
};

function toBiometryBindingStatus(out: BindingOutcome): string {
    switch (out) {
        case "ok": return "ok";
        case "lost": return "lost";
        case "not_present": return "not_present";
        case "error": return "error";
        case "skipped": return "skipped";
    }
}

async function clearAuthRedisKeys(username: string): Promise<void> {
    await redis.del(challengeKey(username), bindingChallengeRedisKey(username));
}

export const getAuthenticationOptions = async (username: string) => {
    const user = await getUser(username);
    if (!user) {
        logger.error(`User ${username} not found`);
        throw new Error('User not found');
    }

    const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: user.credentials.map((cred) => ({
            id: cred.id,
            type: 'public-key',
            transports: cred.transports,
        })),
        userVerification: 'preferred',
        rpID,
    };

    const options = await generateAuthenticationOptions(opts);
    const bindingChallenge = randomBytes(32).toString('base64url');

    logger.debug(`Generating authentication options for user ${username}`);

    await redis.setex(
        challengeKey(username),
        bindingChallengeTtlSeconds,
        options.challenge,
    );
    await redis.setex(
        bindingChallengeRedisKey(username),
        bindingChallengeTtlSeconds,
        bindingChallenge,
    );

    logger.debug(`Authentication options generated for user ${username}`);

    return { ...options, bindingChallenge };
}

async function evaluateBinding(args: {
    username: string;
    userId: string;
    binding?: ClientBindingPayload;
    bindingUnlockHint?: "biometric" | "device_credential" | null;
}): Promise<{ outcome: BindingOutcome; detail?: string }> {
    const { username, userId, binding, bindingUnlockHint } = args;
    const stored = await getKeystoreBindingByUserId(userId);
    const expectedB = await redis.get(bindingChallengeRedisKey(username));

    if (binding?.status === "lost") {
        return { outcome: "lost" };
    }

    if (!binding?.signature) {
        return { outcome: "not_present" };
    }

    if (!binding.challenge) {
        return { outcome: "error", detail: "binding_challenge_missing" };
    }

    if (expectedB !== binding.challenge) {
        return { outcome: "error", detail: "binding_challenge_mismatch" };
    }

    if (!stored) {
        return { outcome: "error", detail: "no_stored_binding_key" };
    }

    const alg: "P-256" | "Ed25519" | null =
        binding.algorithm === "ES256" || binding.algorithm === "P-256" || (!binding.algorithm && stored.algorithm === "P-256")
            ? "P-256"
            : (binding.algorithm === "EdDSA" || (!binding.algorithm && stored.algorithm === "Ed25519") ? "Ed25519" : null);

    if (!alg) {
        return { outcome: "error", detail: "unsupported_binding_algorithm" };
    }

    if (alg !== stored.algorithm) {
        return { outcome: "error", detail: "algorithm_mismatch" };
    }

    const ok = verifySpkiBindingSignature({
        publicKeySpkiB64: stored.publicKeySpkiB64,
        messageUtf8: binding.challenge,
        signatureB64: binding.signature,
        algorithm: stored.algorithm,
    });

    if (!ok) {
        return { outcome: "error", detail: "invalid_binding_signature" };
    }

    if (bindingUnlockHint === "device_credential") {
        await redis.del(bindingChallengeRedisKey(username));
        return { outcome: "error", detail: "device_credential_not_accepted" };
    }

    await redis.del(bindingChallengeRedisKey(username));
    return { outcome: "ok" };
}

export const verifyAuthentication = async (
    username: string,
    body: VerifyAuthenticationBody,
): Promise<VerifyAuthResult> => {
    const { binding, bindingUnlockHint, ...authenticationResponse } = body;

    const user = await getUser(username);
    if (!user) {
        logger.error(`User ${username} not found`);
        throw new Error('User not found');
    }

    const expectedChallenge = await redis.get(challengeKey(username));

    let dbCredential: WebAuthnCredential | undefined;
    for (const cred of user.credentials) {
        if (cred.id === authenticationResponse.id) {
            dbCredential = cred;
            break;
        }
    }

    if (!expectedChallenge) {
        const _id = await insertAuthAttempt({
            schemaVersion: AUTH_AUDIT_SCHEMA_VERSION,
            userId: user.id,
            createdAt: new Date(),
            result: "webauthn_failure",
            errorCode: "no_challenge",
            credentialId: authenticationResponse.id,
            bindingOutcome: "skipped",
            bindingUnlockHint: bindingUnlockHint ?? null,
        });
        await clearAuthRedisKeys(username);
        throw new Error('No challenge found or challenge expired');
    }

    if (!dbCredential) {
        const _id = await insertAuthAttempt({
            schemaVersion: AUTH_AUDIT_SCHEMA_VERSION,
            userId: user.id,
            createdAt: new Date(),
            result: "webauthn_failure",
            errorCode: "credential_not_registered",
            credentialId: authenticationResponse.id,
            bindingOutcome: "skipped",
            bindingUnlockHint: bindingUnlockHint ?? null,
        });
        await clearAuthRedisKeys(username);
        throw new Error('Authenticator is not registered with this site');
    }

    const rateLimitCount = await redis.incr(rateLimitKey(user.id));
    if (rateLimitCount === 1) {
        await redis.expire(rateLimitKey(user.id), bindingChallengeTtlSeconds);
    }
    if (rateLimitCount > authRateLimitMax) {
        const _id = await insertAuthAttempt({
            schemaVersion: AUTH_AUDIT_SCHEMA_VERSION,
            userId: user.id,
            createdAt: new Date(),
            result: "webauthn_failure",
            errorCode: "rate_limited",
            credentialId: authenticationResponse.id,
            bindingOutcome: "skipped",
            bindingUnlockHint: bindingUnlockHint ?? null,
        });
        await clearAuthRedisKeys(username);
        throw new Error("Rate limit exceeded");
    }

    let verification: VerifiedAuthenticationResponse;
    try {
        const opts: VerifyAuthenticationResponseOpts = {
            response: authenticationResponse,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin: expectedOrigins,
            expectedRPID: rpID,
            credential: {
                id: dbCredential.id,
                publicKey: new Uint8Array(dbCredential.publicKey.buffer),
                counter: dbCredential.counter,
                transports: dbCredential.transports,
            },
            requireUserVerification: false,
        };

        verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
        const _error = error as Error;
        logger.error(`Error verifying authentication for user ${username}: ${_error.message}`);
        await insertAuthAttempt({
            schemaVersion: AUTH_AUDIT_SCHEMA_VERSION,
            userId: user.id,
            createdAt: new Date(),
            result: "webauthn_failure",
            errorCode: _error.message.slice(0, 200),
            credentialId: authenticationResponse.id,
            bindingOutcome: "skipped",
            bindingUnlockHint: bindingUnlockHint ?? null,
        });
        await clearAuthRedisKeys(username);
        throw _error;
    }

    const { verified, authenticationInfo } = verification;
    if (!verified || !authenticationInfo) {
        const _id = await insertAuthAttempt({
            schemaVersion: AUTH_AUDIT_SCHEMA_VERSION,
            userId: user.id,
            createdAt: new Date(),
            result: "webauthn_failure",
            errorCode: "webauthn_not_verified",
            credentialId: authenticationResponse.id,
            bindingOutcome: "skipped",
            bindingUnlockHint: bindingUnlockHint ?? null,
        });
        await clearAuthRedisKeys(username);
        return {
            verified: false,
            authAttemptId: _id.toHexString(),
            biometryBindingStatus: toBiometryBindingStatus("skipped"),
            suspiciousActivity: false,
            verification,
        };
    }

    const bindingEval = await evaluateBinding({
        username,
        userId: user.id,
        binding,
        bindingUnlockHint: bindingUnlockHint ?? null,
    });

    const pinDenied =
        authDenyOnBindingPinUnlock &&
        bindingEval.outcome === "error" &&
        bindingEval.detail === "device_credential_not_accepted";

    if (pinDenied) {
        const _id = await insertAuthAttempt({
            schemaVersion: AUTH_AUDIT_SCHEMA_VERSION,
            userId: user.id,
            createdAt: new Date(),
            result: "webauthn_success",
            errorCode: "auth_denied_pin_unlock",
            credentialId: authenticationResponse.id,
            bindingOutcome: "error",
            bindingErrorDetail: "device_credential_not_accepted",
            bindingUnlockHint: "device_credential",
        });
        await clearAuthRedisKeys(username);
        return {
            verified: false,
            authAttemptId: _id.toHexString(),
            biometryBindingStatus: toBiometryBindingStatus("error"),
            suspiciousActivity: false,
            blockReason: "pin_unlock",
            verification,
        };
    }

    const policyDenied =
        authDenyOnBindingLost && bindingEval.outcome === "lost";

    if (policyDenied) {
        const _id = await insertAuthAttempt({
            schemaVersion: AUTH_AUDIT_SCHEMA_VERSION,
            userId: user.id,
            createdAt: new Date(),
            result: "webauthn_success",
            errorCode: "auth_denied_binding_lost",
            credentialId: authenticationResponse.id,
            bindingOutcome: "lost",
            bindingErrorDetail: undefined,
            bindingUnlockHint: bindingUnlockHint ?? null,
        });
        await clearAuthRedisKeys(username);
        return {
            verified: false,
            authAttemptId: _id.toHexString(),
            biometryBindingStatus: toBiometryBindingStatus("lost"),
            suspiciousActivity: true,
            blockReason: "binding_lost",
            verification,
        };
    }

    const _id = await insertAuthAttempt({
        schemaVersion: AUTH_AUDIT_SCHEMA_VERSION,
        userId: user.id,
        createdAt: new Date(),
        result: "webauthn_success",
        credentialId: authenticationResponse.id,
        bindingOutcome: bindingEval.outcome,
        bindingErrorDetail: bindingEval.detail,
        bindingUnlockHint: bindingUnlockHint ?? null,
    });

    dbCredential.counter = authenticationInfo.newCounter;
    await updateUser(user.id, { credentials: user.credentials });

    await clearAuthRedisKeys(username);

    return {
        verified: true,
        authAttemptId: _id.toHexString(),
        biometryBindingStatus: toBiometryBindingStatus(bindingEval.outcome),
        suspiciousActivity: false,
        verification,
    };
}
