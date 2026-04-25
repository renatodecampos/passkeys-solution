import { getRegistrationOptions, verifyRegistration } from '../index';
import { getUser, createUser, updateUser } from '../../infra/database/database';
import { redis } from '../../infra/database/redis';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON, WebAuthnCredential } from '@simplewebauthn/server';

jest.mock('../../infra/database/database');
jest.mock('../../infra/database/redis', () => ({
  redis: { setex: jest.fn(), get: jest.fn() },
}));
jest.mock('@simplewebauthn/server');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../infra/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));

const mockGetUser = jest.mocked(getUser);
const mockCreateUser = jest.mocked(createUser);
const mockUpdateUser = jest.mocked(updateUser);
const mockRedisSetex = jest.mocked(redis.setex);
const mockRedisGet = jest.mocked(redis.get);
const mockGenerateRegistrationOptions = jest.mocked(generateRegistrationOptions);
const mockVerifyRegistrationResponse = jest.mocked(verifyRegistrationResponse);

const mockUser = {
  id: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  credentials: [] as WebAuthnCredential[],
};

const mockCredential: WebAuthnCredential = {
  id: 'cred-id-1',
  publicKey: new Uint8Array([1, 2, 3]),
  counter: 0,
  transports: ['internal'],
};

const mockRegistrationOptions = {
  challenge: 'mock-challenge',
  rp: { name: 'Test', id: 'localhost' },
  user: { id: new Uint8Array([1]), name: 'alice', displayName: 'Alice' },
  pubKeyCredParams: [],
  timeout: 60000,
  attestation: 'none' as const,
  excludeCredentials: [],
  authenticatorSelection: {},
  extensions: {},
};

beforeEach(() => jest.clearAllMocks());

describe('getRegistrationOptions', () => {
  it('returns options for existing user without creating a new user', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockGenerateRegistrationOptions.mockResolvedValue(mockRegistrationOptions as any);
    mockRedisSetex.mockResolvedValue('OK');

    await getRegistrationOptions('alice');

    expect(mockGetUser).toHaveBeenCalledWith('alice');
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockGenerateRegistrationOptions).toHaveBeenCalled();
  });

  it('missing user → creates user via createUser, then returns options', async () => {
    mockGetUser
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockUser);
    mockCreateUser.mockResolvedValue(undefined as any);
    mockGenerateRegistrationOptions.mockResolvedValue(mockRegistrationOptions as any);
    mockRedisSetex.mockResolvedValue('OK');

    await getRegistrationOptions('alice');

    expect(mockCreateUser).toHaveBeenCalledWith({
      id: 'mock-uuid',
      username: 'alice',
      credentials: [],
      displayName: 'alice',
    });
    expect(mockGetUser).toHaveBeenCalledTimes(2);
  });

  it('stores challenge in Redis with 300s TTL', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockGenerateRegistrationOptions.mockResolvedValue(mockRegistrationOptions as any);
    mockRedisSetex.mockResolvedValue('OK');

    await getRegistrationOptions('alice');

    expect(mockRedisSetex).toHaveBeenCalledWith(
      'challenge:alice-registration',
      300,
      'mock-challenge',
    );
  });

  it('excludes existing credentials via excludeCredentials', async () => {
    const userWithCreds = { ...mockUser, credentials: [mockCredential] };
    mockGetUser.mockResolvedValue(userWithCreds);
    mockGenerateRegistrationOptions.mockResolvedValue(mockRegistrationOptions as any);
    mockRedisSetex.mockResolvedValue('OK');

    await getRegistrationOptions('alice');

    const callArgs = mockGenerateRegistrationOptions.mock.calls[0][0];
    expect(callArgs.excludeCredentials).toEqual([
      { id: 'cred-id-1', type: 'public-key', transports: ['internal'] },
    ]);
  });
});

describe('verifyRegistration', () => {
  const mockResponse: RegistrationResponseJSON = {
    id: 'cred-id-1',
    rawId: 'cred-id-1',
    type: 'public-key',
    response: {
      clientDataJSON: 'mock',
      attestationObject: 'mock',
      transports: ['internal'],
    },
    clientExtensionResults: {},
  };

  it('user not found → throws Error("User not found")', async () => {
    mockGetUser.mockResolvedValue(null);

    await expect(verifyRegistration('alice', mockResponse)).rejects.toThrow('User not found');
  });

  it('expired challenge (Redis returns null) → throws Error("No challenge found or challenge expired")', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockResolvedValue(null);

    await expect(verifyRegistration('alice', mockResponse)).rejects.toThrow(
      'No challenge found or challenge expired',
    );
  });

  it('successful verification with new credential → appends to list and calls updateUser', async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, credentials: [] });
    mockRedisGet.mockResolvedValue('mock-challenge');
    mockVerifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'cred-id-1',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
        },
      },
    } as any);
    mockUpdateUser.mockResolvedValue(undefined as any);

    const result = await verifyRegistration('alice', mockResponse);

    expect(result).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalled();
  });

  it('successful verification with existing credential → no duplicate, no updateUser', async () => {
    const userWithCred = { ...mockUser, credentials: [{ ...mockCredential, id: 'cred-id-1' }] };
    mockGetUser.mockResolvedValue(userWithCred);
    mockRedisGet.mockResolvedValue('mock-challenge');
    mockVerifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'cred-id-1',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
        },
      },
    } as any);

    const result = await verifyRegistration('alice', mockResponse);

    expect(result).toBe(true);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('verifyRegistrationResponse throws → rethrows', async () => {
    mockGetUser.mockResolvedValue(mockUser);
    mockRedisGet.mockResolvedValue('mock-challenge');
    mockVerifyRegistrationResponse.mockRejectedValue(new Error('Verification failed'));

    await expect(verifyRegistration('alice', mockResponse)).rejects.toThrow('Verification failed');
  });
});
