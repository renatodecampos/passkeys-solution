import { generateKeyPairSync, createSign, sign as rawSign } from 'node:crypto';
import { verifySpkiBindingSignature } from '../binding-crypto';

describe('verifySpkiBindingSignature', () => {
  it('verifies P-256 signature over UTF-8 message', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    });
    const spki = publicKey.export({ type: 'spki', format: 'der' });
    const msg = 'hello-binding-challenge';
    const sign = createSign('SHA256');
    sign.update(msg);
    sign.end();
    const sig = sign.sign(privateKey);

    const ok = verifySpkiBindingSignature({
      publicKeySpkiB64: Buffer.from(spki).toString('base64'),
      messageUtf8: msg,
      signatureB64: Buffer.from(sig).toString('base64'),
      algorithm: 'P-256',
    });
    expect(ok).toBe(true);
  });

  it('verifies Ed25519 signature', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const spki = publicKey.export({ type: 'spki', format: 'der' });
    const msg = 'ed25519-challenge';
    const sig = rawSign(null, Buffer.from(msg, 'utf8'), privateKey);

    const ok = verifySpkiBindingSignature({
      publicKeySpkiB64: Buffer.from(spki).toString('base64'),
      messageUtf8: msg,
      signatureB64: Buffer.from(sig).toString('base64'),
      algorithm: 'Ed25519',
    });
    expect(ok).toBe(true);
  });

  it('rejects wrong message', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    });
    const spki = publicKey.export({ type: 'spki', format: 'der' });
    const sign = createSign('SHA256');
    sign.update('a');
    sign.end();
    const sig = sign.sign(privateKey);

    const ok = verifySpkiBindingSignature({
      publicKeySpkiB64: Buffer.from(spki).toString('base64'),
      messageUtf8: 'b',
      signatureB64: Buffer.from(sig).toString('base64'),
      algorithm: 'P-256',
    });
    expect(ok).toBe(false);
  });
});
