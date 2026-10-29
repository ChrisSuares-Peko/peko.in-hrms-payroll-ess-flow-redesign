const { encrypt, decrypt } = require('../cardCrypto')

describe('encrypt', () => {
    it('returns null for null/undefined', () => {
        expect(encrypt(null)).toBeNull()
        expect(encrypt(undefined)).toBeNull()
    })

    it('passes a string through unchanged', () => {
        expect(encrypt('https://view')).toBe('https://view')
    })

    it('JSON-stringifies a non-string value', () => {
        expect(encrypt({ a: 1 })).toBe('{"a":1}')
    })
})

describe('decrypt', () => {
    it('returns null for null/undefined/empty string', () => {
        expect(decrypt(null)).toBeNull()
        expect(decrypt(undefined)).toBeNull()
        expect(decrypt('')).toBeNull()
    })

    it('passes the stored payload through unchanged', () => {
        expect(decrypt('plaintext-value')).toBe('plaintext-value')
    })
})
