'use strict';

const crypto = require('crypto');

const VERSION = 'v1';

const sealToken = (plaintext, key) => {
    if (plaintext === null || plaintext === undefined) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    return [VERSION, iv.toString('base64'), ciphertext.toString('base64'), cipher.getAuthTag().toString('base64')].join(':');
};

const openToken = (sealed, key) => {
    if (!sealed) return null;
    const [version, ivBase64, ciphertextBase64, tagBase64] = String(sealed).split(':');
    if (version !== VERSION || !ivBase64 || !ciphertextBase64 || !tagBase64) {
        throw new Error('Unsupported CTRLPay token envelope');
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivBase64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
    return Buffer.concat([
        decipher.update(Buffer.from(ciphertextBase64, 'base64')),
        decipher.final(),
    ]).toString('utf8');
};

module.exports = { sealToken, openToken };
