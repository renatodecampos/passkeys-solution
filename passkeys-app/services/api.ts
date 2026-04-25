const BASE_URL = 'https://localhost:3000';

async function postJSON(path: string, body?: unknown, headers?: Record<string, string>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    let suffix = '';
    try {
      const errObj = JSON.parse(text) as { error?: string };
      if (errObj.error) {
        suffix = `: ${errObj.error}`;
      }
    } catch {
      /* keep suffix empty for non-JSON error bodies */
    }
    throw new Error(`HTTP ${res.status}${suffix}`);
  }
  if (!text) {
    return null;
  }
  return JSON.parse(text) as unknown;
}

export async function generateRegistrationOptions(username: string): Promise<unknown> {
  return postJSON('/generate-registration-options', { username });
}

export async function verifyRegistration(username: string, response: unknown): Promise<unknown> {
  return postJSON('/verify-registration', response, { 'x-username': username });
}

export async function generateAuthenticationOptions(username: string): Promise<unknown> {
  return postJSON('/generate-authentication-options', {}, { 'x-username': username });
}

export async function verifyAuthentication(username: string, response: unknown): Promise<unknown> {
  return postJSON('/verify-authentication', response, { 'x-username': username });
}
