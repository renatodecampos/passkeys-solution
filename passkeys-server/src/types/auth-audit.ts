export const AUTH_AUDIT_SCHEMA_VERSION = 1;
export const KEYSTORE_BINDING_SCHEMA_VERSION = 1;

export type WebAuthnAttemptResult = 'webauthn_success' | 'webauthn_failure';

export type BindingOutcome = 'ok' | 'lost' | 'not_present' | 'error' | 'skipped';

export type BindingAlgorithm = 'P-256' | 'Ed25519';

export type AuthAttemptModel = {
  schemaVersion: number;
  userId: string;
  createdAt: Date;
  result: WebAuthnAttemptResult;
  errorCode?: string;
  credentialId?: string;
  bindingOutcome: BindingOutcome;
  bindingErrorDetail?: string;
  appVersion?: string;
  androidSdk?: string;
  bindingUnlockHint?: 'biometric' | 'device_credential' | null;
};

export type KeystoreBindingModel = {
  schemaVersion: number;
  userId: string;
  publicKeySpkiB64: string;
  algorithm: BindingAlgorithm;
  createdAt: Date;
  revokedAt?: Date;
};
