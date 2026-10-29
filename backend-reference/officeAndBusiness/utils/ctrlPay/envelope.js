'use strict';

const crypto = require('crypto');

const AES_KEY_BYTES = 32;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

class CtrlPayEnvelopeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CtrlPayEnvelopeError';
    }
}

const sealPayload = (payload, key, nonce) => {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    return Buffer.concat([
        cipher.update(JSON.stringify(payload ?? {}), 'utf8'),
        cipher.final(),
        cipher.getAuthTag(),
    ]);
};

const openCiphertext = (ciphertextBase64, { key, nonce }) => {
    const raw = Buffer.from(ciphertextBase64, 'base64');
    if (raw.length <= TAG_BYTES) {
        throw new CtrlPayEnvelopeError('Response ciphertext is too short');
    }
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
        decipher.setAuthTag(raw.subarray(raw.length - TAG_BYTES));
        return Buffer.concat([
            decipher.update(raw.subarray(0, raw.length - TAG_BYTES)),
            decipher.final(),
        ]).toString('utf8');
    } catch {
        throw new CtrlPayEnvelopeError('Response failed authentication');
    }
};

const encryptRequest = (payload, publicKey) => {
    const key = crypto.randomBytes(AES_KEY_BYTES);
    const nonce = crypto.randomBytes(NONCE_BYTES);
    const encryptedKey = crypto.publicEncrypt(
        { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        key
    );
    return {
        body: {
            encrypted_key: encryptedKey.toString('base64'),
            nonce: nonce.toString('base64'),
            ciphertext: sealPayload(payload, key, nonce).toString('base64'),
        },
        session: { key, nonce },
    };
};

const readResponse = (httpBody, session) => {
    if (!httpBody || typeof httpBody !== 'object' || !Object.prototype.hasOwnProperty.call(httpBody, 'message')) {
        throw new CtrlPayEnvelopeError('Response is not in the { message } shape');
    }
    const { message } = httpBody;
    if (!message || typeof message !== 'object' || typeof message.ciphertext !== 'string') {
        return message;
    }
    let decrypted;
    try {
        decrypted = JSON.parse(openCiphertext(message.ciphertext, session));
    } catch (error) {
        if (error instanceof CtrlPayEnvelopeError) throw error;
        throw new CtrlPayEnvelopeError('Decrypted response is not JSON');
    }
    if (!decrypted || typeof decrypted !== 'object' || !Object.prototype.hasOwnProperty.call(decrypted, 'message')) {
        throw new CtrlPayEnvelopeError('Decrypted response is not in the { message } shape');
    }
    return decrypted.message;
};

module.exports = { encryptRequest, readResponse, sealPayload, CtrlPayEnvelopeError };
