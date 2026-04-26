jest.mock('../../setup', () => {
  const actual = jest.requireActual<typeof import('../../setup')>('../../setup');
  return { ...actual, authDenyOnBindingLost: true, authDenyOnBindingPinUnlock: true };
});

import { verifyAuthentication } from '../index';
import { getUser, updateUser, insertAuthAttempt, getKeystoreBindingByUserId } from '../../infra/database/database';
import { redis } from '../../infra/database/redis';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
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
const mockRedisGet = jest.mocked(redis.get);
const mockRedisDel = jest.mocked(redis.del);
const mockRedisIncr = jest.mocked(redis.incr);
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

const baseBody: AuthenticationResponseJSON = {
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

const successfulWebAuthnVerification = {
  verified: true,
  authenticationInfo: {
    newCounter: 6,
    credentialID: 'cred-id-1',
    userVerified: true,
    credentialDeviceType: 'singleDevice' as const,
    credentialBackedUp: false,
    origin: 'https://localhost:3000',
    rpID: 'localhost',
  },
};

describe('AUTH_DENY_ON_BINDING_LOST', () => {
  it('WebAuthn ok + binding status lost → verified false, attempt records policy', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockImplementation(async (key) => {
      const k = String(key);
      if (k.includes('binding-challenge')) return 'bch';
      return 'auth-challenge';
    });
    mockVerifyAuthenticationResponse.mockResolvedValue(successfulWebAuthnVerification as any);

    const result = await verifyAuthentication('alice', {
      ...baseBody,
      binding: { status: 'lost' },
    });

    expect(result.verified).toBe(false);
    expect(result.biometryBindingStatus).toBe('lost');
    expect(result.suspiciousActivity).toBe(true);
    expect(result.blockReason).toBe('binding_lost');
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockInsertAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'webauthn_success',
        errorCode: 'auth_denied_binding_lost',
        bindingOutcome: 'lost',
      }),
    );
  });
});

describe('AUTH_DENY_ON_BINDING_PIN_UNLOCK', () => {
  it('device_credential unlock + flag true → verified false, blockReason pin_unlock, suspiciousActivity false', async () => {
    const { generateKeyPairSync, createSign } = require('node:crypto');
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const spkiB64 = Buffer.from(publicKey.export({ type: 'spki', format: 'der' })).toString('base64');
    const bindingChallenge = 'bch-pin-test';
    const sig = (() => {
      const s = createSign('SHA256');
      s.update(bindingChallenge);
      s.end();
      return s.sign(privateKey).toString('base64');
    })();

    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockImplementation(async (key) => {
      if (String(key).includes('binding-challenge')) return bindingChallenge;
      return 'auth-challenge';
    });
    mockGetKeystoreBinding.mockResolvedValue({
      schemaVersion: 1,
      userId: 'user-1',
      publicKeySpkiB64: spkiB64,
      algorithm: 'P-256',
      createdAt: new Date(),
    });
    mockVerifyAuthenticationResponse.mockResolvedValue(successfulWebAuthnVerification as any);

    const result = await verifyAuthentication('alice', {
      ...baseBody,
      binding: { challenge: bindingChallenge, signature: sig, algorithm: 'ES256' },
      bindingUnlockHint: 'device_credential',
    });

    expect(result.verified).toBe(false);
    expect(result.suspiciousActivity).toBe(false);
    expect(result.blockReason).toBe('pin_unlock');
    expect(mockInsertAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'auth_denied_pin_unlock',
        bindingOutcome: 'error',
        bindingUnlockHint: 'device_credential',
      }),
    );
  });
});
