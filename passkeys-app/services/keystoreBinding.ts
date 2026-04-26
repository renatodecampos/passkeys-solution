import { NativeModules, Platform } from 'react-native';

type CreateKeyResult = { publicKeySpkiB64: string; algorithm: string };
type SignResult =
  | { ok: true; signature: string; unlockHint: string }
  | { ok: false; code: string; message?: string };

const mod = NativeModules.KeystoreBinding as
  | {
      createKey: () => Promise<CreateKeyResult>;
      signChallenge: (challenge: string) => Promise<SignResult>;
    }
  | undefined;

export function isKeystoreBindingAvailable(): boolean {
  return Platform.OS === 'android' && mod != null;
}

export async function createKeystoreBindingKey(): Promise<{ publicKeySpkiB64: string } | null> {
  if (!mod?.createKey) {
    return null;
  }
  const r = await mod.createKey();
  return { publicKeySpkiB64: r.publicKeySpkiB64 };
}

export type SignKeystoreBindingResult =
  | { status: 'ok'; signature: string; unlockHint: 'biometric' | 'device_credential' }
  | { status: 'lost' }
  | { status: 'no_key' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function signKeystoreBindingChallenge(challenge: string): Promise<SignKeystoreBindingResult> {
  if (!mod?.signChallenge) {
    return { status: 'error', message: 'native_module' };
  }
  const r = await mod.signChallenge(challenge);
  if (r.ok === true) {
    const hint = r.unlockHint === 'device_credential' ? 'device_credential' : 'biometric';
    return { status: 'ok', signature: r.signature, unlockHint: hint };
  }
  if (r.code === 'lost') {
    return { status: 'lost' };
  }
  if (r.code === 'no_key') {
    return { status: 'no_key' };
  }
  if (r.code === 'cancelled') {
    return { status: 'cancelled' };
  }
  return { status: 'error', message: r.message ?? r.code };
}
