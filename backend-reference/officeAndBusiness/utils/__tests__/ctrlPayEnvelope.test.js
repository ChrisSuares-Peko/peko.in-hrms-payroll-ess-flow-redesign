const crypto = require('crypto');

const {
    CtrlPayEnvelopeError,
    encryptRequest,
    readResponse,
    sealPayload,
} = require('../ctrlPay/envelope');

const hex = (value) => Buffer.from(value, 'hex');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const unwrapKey = (encryptedKey) =>
    crypto.privateDecrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        Buffer.from(encryptedKey, 'base64')
    );

describe('CTRLPay request envelope', () => {
    it('matches the guide known answer for request encryption', () => {
        const ciphertext = sealPayload(
            { pan: 'ABCCD1234E', mobile: '9876543210' },
            hex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),
            hex('000102030405060708090a0b')
        );
        expect(ciphertext.toString('base64')).toBe(
            'PCCmeqvH+DnMA9TI9dhKXreTpRjSFjAeUQuApydLOYo2JpvInPMjqFbZRe39Go2AMkKDwwLGRqS9Vw=='
        );
    });

    it('matches the guide known answer for response decryption', () => {
        const payload = readResponse(
            {
                message: {
                    ciphertext:
                        'iMD+PTKaFRyut2fpWe23BQ5awfNzyavAr5mYba4Nl8GYmbw9I45K5eewEx4Z8ovcT4U7O/Ni1J05iG3DDCyYApIri0w8EORCmka03erGVA==',
                },
            },
            {
                key: hex('a0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebf'),
                nonce: hex('b0b1b2b3b4b5b6b7b8b9babb'),
            }
        );
        expect(payload).toEqual({ status: 'SUCCESS', message: 'Valid partner code' });
    });

    it('wraps a fresh 32-byte key with RSA-OAEP SHA-256 that only the private key opens', () => {
        const first = encryptRequest({ otp: '123456' }, publicKey);
        const second = encryptRequest({ otp: '123456' }, publicKey);

        const key = unwrapKey(first.body.encrypted_key);
        expect(key.equals(first.session.key)).toBe(true);
        expect(key).toHaveLength(32);
        expect(Buffer.from(first.body.nonce, 'base64')).toHaveLength(12);
        expect(first.session.key.equals(second.session.key)).toBe(false);
        expect(first.body.nonce).not.toBe(second.body.nonce);
    });

    it('encrypts an empty object when there are no parameters and reads its own response', () => {
        const { body, session } = encryptRequest(undefined, publicKey);
        const sealed = sealPayload({ message: { status: 'SUCCESS' } }, unwrapKey(body.encrypted_key), session.nonce);

        expect(readResponse({ message: { ciphertext: sealed.toString('base64') } }, session)).toEqual({
            status: 'SUCCESS',
        });
        const request = sealPayload({}, session.key, session.nonce).toString('base64');
        expect(body.ciphertext).toBe(request);
    });

    it('passes plaintext payloads through untouched', () => {
        const session = { key: crypto.randomBytes(32), nonce: crypto.randomBytes(12) };
        expect(readResponse({ message: 'vanta.logistics@ctrlpay' }, session)).toBe('vanta.logistics@ctrlpay');
        expect(readResponse({ message: null }, session)).toBeNull();
        expect(readResponse({ message: [{ name: 'CTRL1' }] }, session)).toEqual([{ name: 'CTRL1' }]);
        expect(readResponse({ message: { status: 'ERROR', message: 'Invalid encrypted payload' } }, session)).toEqual({
            status: 'ERROR',
            message: 'Invalid encrypted payload',
        });
    });

    it('rejects a tampered response and anything outside the { message } shape', () => {
        const session = { key: crypto.randomBytes(32), nonce: crypto.randomBytes(12) };
        const sealed = sealPayload({ message: { status: 'SUCCESS' } }, session.key, session.nonce);
        sealed[0] ^= 0xff;

        expect(() => readResponse({ message: { ciphertext: sealed.toString('base64') } }, session)).toThrow(
            CtrlPayEnvelopeError
        );
        expect(() => readResponse({ exc_type: 'Exception' }, session)).toThrow(CtrlPayEnvelopeError);
        expect(() => readResponse('<html>', session)).toThrow(CtrlPayEnvelopeError);
    });
});
