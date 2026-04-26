import { getAuthenticationOptions, verifyAuthentication } from '../index';
import { getUser, updateUser, insertAuthAttempt, getKeystoreBindingByUserId } from '../../infra/database/database';
import { redis } from '../../infra/database/redis';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, WebAuthnCredential } from '@simplewebauthn/server';
import { ObjectId } from 'mongodb';

jest.mock('../../infra/database/database');
jest.mock('../../infra/database/redis', () => ({
  redis: { setex: jest.fn(), get: jest.fn(), del: jest.fn(), incr: jest.fn(), expire: jest.fn() },
}));
jest.mock('@simplewebauthn/server');
jest.mock('../../infra/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));

const mockGetUser = jest.mocked(getUser);
const mockUpdateUser = jest.mocked(updateUser);
const mockInsertAuthAttempt = jest.mocked(insertAuthAttempt);
const mockGetKeystoreBinding = jest.mocked(getKeystoreBindingByUserId);
const mockRedisSetex = jest.mocked(redis.setex);
const mockRedisGet = jest.mocked(redis.get);
const mockRedisDel = jest.mocked(redis.del);
const mockRedisIncr = jest.mocked(redis.incr);
const mockGenerateAuthenticationOptions = jest.mocked(generateAuthenticationOptions);
const mockVerifyAuthenticationResponse = jest.mocked(verifyAuthenticationResponse);

const attemptId = new ObjectId('507f1f77bcf86cd799439011');

const mockCredential: WebAuthnCredential = {
  id: 'cred-id-1',
  publicKey: new Uint8Array([1, 2, 3]),
  counter: 5,
  transports: ['internal'],
};

const mockUser = {
  id: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  credentials: [mockCredential],
};

const mockAuthOptions = {
  challenge: 'auth-challenge',
  timeout: 60000,
  rpId: 'localhost',
  allowCredentials: [],
  userVerification: 'preferred' as const,
};

const mockAuthResponse: AuthenticationResponseJSON = {
  id: 'cred-id-1',
  rawId: 'cred-id-1',
  type: 'public-key',
  response: {
    clientDataJSON: 'mock',
    authenticatorData: 'mock',
    signature: 'mock',
  },
  clientExtensionResults: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  mockInsertAuthAttempt.mockResolvedValue(attemptId);
  mockGetKeystoreBinding.mockResolvedValue(null);
  mockRedisDel.mockResolvedValue(1);
  mockRedisIncr.mockResolvedValue(1); // within rate limit by default
});

describe('getAuthenticationOptions', () => {
  it('user not found → throws Error("User not found")', async () => {
    mockGetUser.mockResolvedValue(null);

    await expect(getAuthenticationOptions('alice')).rejects.toThrow('User not found');
  });

  it('user with credentials → returns options with correct allowCredentials', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions as any);
    mockRedisSetex.mockResolvedValue('OK');

    await getAuthenticationOptions('alice');

    const callArgs = mockGenerateAuthenticationOptions.mock.calls[0][0];
    expect(callArgs.allowCredentials).toEqual([
      { id: 'cred-id-1', type: 'public-key', transports: ['internal'] },
    ]);
  });

  it('stores WebAuthn and binding challenges in Redis with 300s TTL', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions as any);
    mockRedisSetex.mockResolvedValue('OK');

    const out = await getAuthenticationOptions('alice');

    expect(mockRedisSetex).toHaveBeenCalledWith(
      'challenge:alice-authentication',
      300,
      'auth-challenge',
    );
    expect(mockRedisSetex).toHaveBeenCalledWith(
      'webauthn-binding-challenge:alice',
      300,
      expect.any(String),
    );
    expect(out).toEqual(
      expect.objectContaining({
        challenge: 'auth-challenge',
        bindingChallenge: expect.any(String),
      }),
    );
  });
});

describe('verifyAuthentication', () => {
  it('user not found → throws Error("User not found")', async () => {
    mockGetUser.mockResolvedValue(null);

    await expect(verifyAuthentication('alice', mockAuthResponse)).rejects.toThrow('User not found');
  });

  it('expired challenge → writes attempt (skipped) and throws', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockResolvedValue(null);

    await expect(verifyAuthentication('alice', mockAuthResponse)).rejects.toThrow(
      'No challenge found or challenge expired',
    );
    expect(mockInsertAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'webauthn_failure',
        bindingOutcome: 'skipped',
      }),
    );
    expect(mockRedisDel).toHaveBeenCalled();
  });

  it('credential not registered for user → writes attempt and throws', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockResolvedValue('auth-challenge');

    const responseWithUnknownCred: AuthenticationResponseJSON = {
      ...mockAuthResponse,
      id: 'unknown-cred-id',
      rawId: 'unknown-cred-id',
    };

    await expect(verifyAuthentication('alice', responseWithUnknownCred)).rejects.toThrow(
      'Authenticator is not registered with this site',
    );
    expect(mockInsertAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'webauthn_failure',
        bindingOutcome: 'skipped',
      }),
    );
  });

  it('successful verification (no binding in DB) → not_present, updates counter', async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, credentials: [{ ...mockCredential }] });
    mockRedisGet.mockImplementation(async (key) => {
      const k = String(key);
      if (k.includes('binding-challenge')) return 'bch';
      return 'auth-challenge';
    });
    mockVerifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: {
        newCounter: 6,
        credentialID: 'cred-id-1',
        userVerified: true,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        origin: 'https://localhost:3000',
        rpID: 'localhost',
      },
    } as any);
    mockUpdateUser.mockResolvedValue(undefined as any);

    const result = await verifyAuthentication('alice', mockAuthResponse);

    expect(result.verified).toBe(true);
    expect(result.biometryBindingStatus).toBe('not_present');
    expect(result.authAttemptId).toBe(attemptId.toHexString());
    expect(mockUpdateUser).toHaveBeenCalled();
    expect(mockInsertAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 1,
        result: 'webauthn_success',
        bindingOutcome: 'not_present',
      }),
    );
    expect(mockRedisDel).toHaveBeenCalled();
  });

  it('verifyAuthenticationResponse throws → rethrows after attempt', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockResolvedValue('auth-challenge');
    mockVerifyAuthenticationResponse.mockRejectedValue(new Error('Auth verification failed'));

    await expect(verifyAuthentication('alice', mockAuthResponse)).rejects.toThrow(
      'Auth verification failed',
    );
    expect(mockInsertAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ bindingOutcome: 'skipped' }),
    );
  });

  it('rate limit exceeded → writes attempt (rate_limited) and throws', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockResolvedValue('auth-challenge');
    mockRedisIncr.mockResolvedValue(4); // > limit of 3

    await expect(verifyAuthentication('alice', mockAuthResponse)).rejects.toThrow(
      'Rate limit exceeded',
    );
    expect(mockInsertAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'webauthn_failure',
        errorCode: 'rate_limited',
        bindingOutcome: 'skipped',
      }),
    );
    expect(mockRedisDel).toHaveBeenCalled();
  });

  it('within rate limit (incr=1) → proceeds to WebAuthn verify', async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, credentials: [{ ...mockCredential }] });
    mockRedisGet.mockImplementation(async (key) => {
      if (String(key).includes('binding-challenge')) return 'bch';
      return 'auth-challenge';
    });
    mockRedisIncr.mockResolvedValue(1);
    mockVerifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: {
        newCounter: 6,
        credentialID: 'cred-id-1',
        userVerified: true,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        origin: 'https://localhost:3000',
        rpID: 'localhost',
      },
    } as any);
    mockUpdateUser.mockResolvedValue(undefined as any);

    const result = await verifyAuthentication('alice', mockAuthResponse);

    expect(result.verified).toBe(true);
    expect(mockRedisIncr).toHaveBeenCalledWith(expect.stringContaining('auth-ratelimit:'));
  });
});
