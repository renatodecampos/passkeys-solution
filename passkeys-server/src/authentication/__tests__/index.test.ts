import { getAuthenticationOptions, verifyAuthentication } from '../index';
import { getUser, updateUser } from '../../infra/database/database';
import { redis } from '../../infra/database/redis';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, WebAuthnCredential } from '@simplewebauthn/server';

jest.mock('../../infra/database/database');
jest.mock('../../infra/database/redis', () => ({
  redis: { setex: jest.fn(), get: jest.fn() },
}));
jest.mock('@simplewebauthn/server');
jest.mock('../../infra/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));

const mockGetUser = jest.mocked(getUser);
const mockUpdateUser = jest.mocked(updateUser);
const mockRedisSetex = jest.mocked(redis.setex);
const mockRedisGet = jest.mocked(redis.get);
const mockGenerateAuthenticationOptions = jest.mocked(generateAuthenticationOptions);
const mockVerifyAuthenticationResponse = jest.mocked(verifyAuthenticationResponse);

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

beforeEach(() => jest.clearAllMocks());

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

  it('stores challenge in Redis with 300s TTL', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions as any);
    mockRedisSetex.mockResolvedValue('OK');

    await getAuthenticationOptions('alice');

    expect(mockRedisSetex).toHaveBeenCalledWith(
      'challenge:alice-authentication',
      300,
      'auth-challenge',
    );
  });
});

describe('verifyAuthentication', () => {
  it('user not found → throws Error("User not found")', async () => {
    mockGetUser.mockResolvedValue(null);

    await expect(verifyAuthentication('alice', mockAuthResponse)).rejects.toThrow('User not found');
  });

  it('expired challenge → throws Error("No challenge found or challenge expired")', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockResolvedValue(null);

    await expect(verifyAuthentication('alice', mockAuthResponse)).rejects.toThrow(
      'No challenge found or challenge expired',
    );
  });

  it('credential not registered for user → throws Error("Authenticator is not registered with this site")', async () => {
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
  });

  it('successful verification → updates counter via updateUser', async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, credentials: [{ ...mockCredential }] });
    mockRedisGet.mockResolvedValue('auth-challenge');
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
    expect(mockUpdateUser).toHaveBeenCalled();
  });

  it('verifyAuthenticationResponse throws → rethrows', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockResolvedValue('auth-challenge');
    mockVerifyAuthenticationResponse.mockRejectedValue(new Error('Auth verification failed'));

    await expect(verifyAuthentication('alice', mockAuthResponse)).rejects.toThrow(
      'Auth verification failed',
    );
  });
});
