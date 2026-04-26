import { createPublicKey, createVerify, verify, type KeyObject } from 'node:crypto';

/**
 * Verifies a signature over the UTF-8 message using an SPKI public key (P-256 or Ed25519).
 * P-256 expects ECDSA in DER (SHA-256) as produced by common Android/Keystore paths.
 */
export function verifySpkiBindingSignature(params: {
    publicKeySpkiB64: string;
    messageUtf8: string;
    signatureB64: string;
    algorithm: 'P-256' | 'Ed25519';
}): boolean {
    const { publicKeySpkiB64, messageUtf8, signatureB64, algorithm } = params;
    const key = createPublicKey({
        key: Buffer.from(publicKeySpkiB64, 'base64'),
        format: 'der',
        type: 'spki',
    });
    const msg = Buffer.from(messageUtf8, 'utf8');
    const sig = Buffer.from(signatureB64, 'base64');
    if (algorithm === 'Ed25519') {
        return verify(null, msg, key, sig);
    }
    const v = createVerify('SHA256');
    v.update(msg);
    v.end();
    return v.verify({ key: key as KeyObject, dsaEncoding: 'der' }, sig);
}
