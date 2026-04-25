import fetchMock from 'jest-fetch-mock';
import {
  API_BASE_URL,
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
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
