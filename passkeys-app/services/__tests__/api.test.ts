import fetchMock from 'jest-fetch-mock';
import {
  API_BASE_URL,
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
  registerKeystoreBinding,
} from '../api';

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('generateRegistrationOptions', () => {
  it('sends POST with username body and returns JSON', async () => {
    const mockResponse = { challenge: 'abc123' };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await generateRegistrationOptions('alice');

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/generate-registration-options`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username: 'alice' }),
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('verifyRegistration', () => {
  it('sends POST with x-username header and returns JSON', async () => {
    const mockResponse = { verified: true };
    const payload = { id: 'cred1', type: 'public-key' };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await verifyRegistration('alice', payload);

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/verify-registration`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-username': 'alice',
        }),
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('generateAuthenticationOptions', () => {
  it('sends POST with x-username header and returns JSON', async () => {
    const mockResponse = { challenge: 'xyz789' };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await generateAuthenticationOptions('alice');

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/generate-authentication-options`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-username': 'alice',
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('verifyAuthentication', () => {
  it('sends POST with x-username header and returns JSON', async () => {
    const mockResponse = { verified: true };
    const payload = { id: 'cred1', type: 'public-key' };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await verifyAuthentication('alice', payload);

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/verify-authentication`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-username': 'alice',
        }),
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('merges binding and bindingUnlockHint into verify body', async () => {
    const mockResponse = { verified: true, biometryBindingStatus: 'ok' };
    const webauthn = { id: 'cred1', type: 'public-key', response: { a: 1 } };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await verifyAuthentication('alice', webauthn, {
      binding: { challenge: 'bch1', signature: 'sig1=', algorithm: 'ES256' },
      bindingUnlockHint: 'biometric',
    });

    expect(JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)).toEqual({
      ...webauthn,
      binding: { challenge: 'bch1', signature: 'sig1=', algorithm: 'ES256' },
      bindingUnlockHint: 'biometric',
    });
    expect(result).toEqual(mockResponse);
  });

  it('sends binding status lost', async () => {
    const mockResponse = { verified: true, biometryBindingStatus: 'lost' };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));
    const webauthn = { id: 'c', type: 'public-key' };
    await verifyAuthentication('u', webauthn, { binding: { status: 'lost' } });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual(
      expect.objectContaining({
        id: 'c',
        binding: { status: 'lost' },
      })
    );
  });
});

describe('registerKeystoreBinding', () => {
  it('sends POST to register-keystore-binding with public key and algorithm', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ ok: true }));
    await registerKeystoreBinding('alice', { publicKeySpkiB64: 'cGs=', algorithm: 'P-256' });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/register-keystore-binding`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ publicKeySpkiB64: 'cGs=', algorithm: 'P-256' }),
        headers: expect.objectContaining({ 'x-username': 'alice' }),
      })
    );
  });
});

describe('network error', () => {
  it('propagates fetch rejection to caller', async () => {
    fetchMock.mockRejectOnce(new Error('Network failure'));

    await expect(generateRegistrationOptions('alice')).rejects.toThrow('Network failure');
  });

  it('throws Error with HTTP status when response is not ok', async () => {
    fetchMock.mockResponseOnce('Unauthorized', { status: 401 });

    await expect(generateRegistrationOptions('alice')).rejects.toThrow('HTTP 401');
  });

  it('appends server error string when body is JSON with error field', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'User not found' }), { status: 404 });

    await expect(generateRegistrationOptions('bob')).rejects.toThrow(
      'HTTP 404: User not found'
    );
  });
});
