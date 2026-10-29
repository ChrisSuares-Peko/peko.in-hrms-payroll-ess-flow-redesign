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

    it('should be deterministic (fixed IV)', () => {
        const r1 = encrypt(PLAINTEXT, TEST_KEY);
        const r2 = encrypt(PLAINTEXT, TEST_KEY);
        expect(r1).toBe(r2);
    });

    it('should produce different ciphertext for different keys', () => {
        expect(encrypt(PLAINTEXT, 'key1')).not.toBe(encrypt(PLAINTEXT, 'key2'));
    });
});

describe('decrypt', () => {
    it('should correctly decrypt an encrypted value (round-trip)', () => {
        const encrypted = encrypt(PLAINTEXT, TEST_KEY);
        expect(decrypt(encrypted, TEST_KEY)).toBe(PLAINTEXT);
    });

    it('should round-trip XML content', () => {
        const xml = '<?xml version="1.0"?><root><id>B001</id></root>';
        expect(decrypt(encrypt(xml, TEST_KEY), TEST_KEY)).toBe(xml);
    });

    it('should round-trip an empty string', () => {
        expect(decrypt(encrypt('', TEST_KEY), TEST_KEY)).toBe('');
    });
});
