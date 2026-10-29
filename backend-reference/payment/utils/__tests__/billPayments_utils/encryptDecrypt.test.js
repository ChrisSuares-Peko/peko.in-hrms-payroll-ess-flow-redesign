const { encrypt, decrypt } = require('../../billPayments_utils');

const TEST_KEY = 'mySecretKey';
const PLAINTEXT = 'Hello, BBPS!';

describe('encrypt', () => {
    it('should return a non-empty hex string', () => {
        const result = encrypt(PLAINTEXT, TEST_KEY);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('should produce the same output for the same input (deterministic IV)', () => {
        const r1 = encrypt(PLAINTEXT, TEST_KEY);
        const r2 = encrypt(PLAINTEXT, TEST_KEY);
        expect(r1).toBe(r2);
    });

    it('should produce different ciphertext for different keys', () => {
        const r1 = encrypt(PLAINTEXT, 'key1');
        const r2 = encrypt(PLAINTEXT, 'key2');
        expect(r1).not.toBe(r2);
    });

    it('should produce different ciphertext for different plaintexts', () => {
        const r1 = encrypt('text1', TEST_KEY);
        const r2 = encrypt('text2', TEST_KEY);
        expect(r1).not.toBe(r2);
    });
});

describe('decrypt', () => {
    it('should correctly decrypt an encrypted value (round-trip)', () => {
        const encrypted = encrypt(PLAINTEXT, TEST_KEY);
        const decrypted = decrypt(encrypted, TEST_KEY);
        expect(decrypted).toBe(PLAINTEXT);
    });

    it('should round-trip longer strings with XML-like content', () => {
        const xml = '<?xml version="1.0"?><root><billerId>B001</billerId></root>';
        const encrypted = encrypt(xml, TEST_KEY);
        const decrypted = decrypt(encrypted, TEST_KEY);
        expect(decrypted).toBe(xml);
    });

    it('should round-trip an empty string', () => {
        const encrypted = encrypt('', TEST_KEY);
        const decrypted = decrypt(encrypted, TEST_KEY);
        expect(decrypted).toBe('');
    });
});
