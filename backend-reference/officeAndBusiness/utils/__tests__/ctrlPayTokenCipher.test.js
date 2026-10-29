const crypto = require('crypto');

const { openToken, sealToken } = require('../ctrlPay/tokenCipher');

const key = crypto.randomBytes(32);

describe('CTRLPay token cipher', () => {
    it('round-trips a token and never stores it in the clear', () => {
        const sealed = sealToken('eyJhbGciOi.token.value', key);

        expect(sealed.startsWith('v1:')).toBe(true);
        expect(sealed).not.toContain('eyJhbGciOi');
        expect(openToken(sealed, key)).toBe('eyJhbGciOi.token.value');
    });

    it('uses a fresh IV for every seal', () => {
        expect(sealToken('same', key)).not.toBe(sealToken('same', key));
    });

    it('passes empty values through as null', () => {
        expect(sealToken(null, key)).toBeNull();
        expect(openToken(null, key)).toBeNull();
        expect(openToken('', key)).toBeNull();
    });

    it('refuses a tampered value, the wrong key and an unknown version', () => {
        const sealed = sealToken('secret', key);
        const [version, iv, ciphertext, tag] = sealed.split(':');
        const flipped = Buffer.from(ciphertext, 'base64');
        flipped[0] ^= 0xff;

        expect(() => openToken([version, iv, flipped.toString('base64'), tag].join(':'), key)).toThrow();
        expect(() => openToken(sealed, crypto.randomBytes(32))).toThrow();
        expect(() => openToken(sealed.replace(/^v1/, 'v9'), key)).toThrow('Unsupported CTRLPay token envelope');
    });
});
