jest.mock('../../setup', () => {
  const actual = jest.requireActual<typeof import('../../setup')>('../../setup');
  return { ...actual, authDenyOnBindingLost: true };
});

import { verifyAuthentication } from '../index';
import { getUser, updateUser, insertAuthAttempt, getKeystoreBindingByUserId } from '../../infra/database/database';
import { redis } from '../../infra/database/redis';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, WebAuthnCredential } from '@simplewebauthn/server';
import { ObjectId } from 'mongodb';

jest.mock('../../infra/database/database');
jest.mock('../../infra/database/redis', () => ({
  redis: { setex: jest.fn(), get: jest.fn(), del: jest.fn() },
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
});

describe('AUTH_DENY_ON_BINDING_LOST', () => {
  it('WebAuthn ok + binding status lost → verified false, attempt records policy', async () => {
    mockGetUser.mockResolvedValue(mockUser);
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

    const result = await verifyAuthentication('alice', {
      ...baseBody,
      binding: { status: 'lost' },
    });

    expect(result.verified).toBe(false);
    expect(result.biometryBindingStatus).toBe('lost');
    expect(result.suspiciousActivity).toBe(true);
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
