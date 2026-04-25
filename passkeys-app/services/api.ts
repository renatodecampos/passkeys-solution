/** Set `EXPO_PUBLIC_API_BASE_URL` in `passkeys-app/.env` (see `.env.example`). */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'https://localhost:3000'
).trim();

const apiDebug = typeof __DEV__ !== 'undefined' && __DEV__;

const BODY_LOG_MAX = 500;

function logRequest(url: string, path: string, hasBody: boolean, headerKeys: string[]): void {
  if (!apiDebug) return;
  console.log('[API] → POST', path, { url, apiBase: API_BASE_URL, hasBody, headers: headerKeys });
}

function logFetchError(path: string, url: string, err: unknown): void {
  if (!apiDebug) return;
  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : 'Error';
  console.error('[API] fetch failed', { path, url, name, message });
  if (message === 'Network request failed') {
    console.warn(
      '[API] If you use 127.0.0.1/localhost on the Android emulator, run `npm run adb:reverse` (or adb reverse tcp:3000 tcp:3000) after the emulator starts — otherwise 127.0.0.1 is the VM, not your Mac. Also: mkcert CA on the device, server on :3000 (CLAUDE.md).'
    );
  }
}

function logHttpError(path: string, status: number, text: string): void {
  if (!apiDebug) return;
  console.error('[API] HTTP error', {
    path,
    status,
    bodyPreview: text.length > BODY_LOG_MAX ? `${text.slice(0, BODY_LOG_MAX)}…` : text,
  });
}

function logJsonParseError(path: string, preview: string): void {
  if (!apiDebug) return;
  console.error('[API] invalid JSON in response', { path, preview });
}

async function postJSON(path: string, body?: unknown, headers?: Record<string, string>): Promise<unknown> {
  const url = `${API_BASE_URL}${path}`;
  const headerKeys = Object.keys(headers ?? {});

  logRequest(url, path, body !== undefined, headerKeys);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    logFetchError(path, url, err);
    throw err;
  }

  const text = await res.text();
  if (!res.ok) {
    logHttpError(path, res.status, text);
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
  try {
    return JSON.parse(text) as unknown;
  } catch (err) {
    logJsonParseError(path, text.length > 200 ? `${text.slice(0, 200)}…` : text);
    throw err;
  }
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
