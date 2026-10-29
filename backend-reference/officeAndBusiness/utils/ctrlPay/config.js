'use strict';

const crypto = require('crypto');

const { CTRLPAY_ACCESS_KEY } = require('../../constants/ctrlPay');
const { findServiceOperatorByAccessKey } = require('../checkAndFetchServiceDetails');

const VENDOR_COLUMNS = {
    baseUrl: 'apiUrl',
    clientId: 'optional1',
    authDomain: 'optional2',
    publicKey: 'optional3',
    redirectUri: 'optional4',
    partnerCode: 'optional5',
};

const TOKEN_KEY_ENV = 'CTRLPAY_TOKEN_ENCRYPTION_KEY';

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

const PEM_BLOCK = /-----BEGIN (RSA )?PUBLIC KEY-----([\s\S]*?)-----END (?:RSA )?PUBLIC KEY-----/;

class CtrlPayConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CtrlPayConfigError';
    }
}

const columnLabel = (field) => `${VENDOR_COLUMNS[field]} (${field})`;

const vendorError = (field, problem) => new CtrlPayConfigError(`CTRLPay vendor ${columnLabel(field)} ${problem}`);

const vendorValue = (vendor, field) => String(vendor[VENDOR_COLUMNS[field]] ?? '').trim();

const httpsUrl = (vendor, field, { allowLocalHttp = false } = {}) => {
    const raw = vendorValue(vendor, field).replace(/\/+$/, '');
    let parsed;
    try {
        parsed = new URL(raw);
    } catch {
        throw vendorError(field, 'is not a valid URL');
    }
    const localHttp = allowLocalHttp && parsed.protocol === 'http:' && LOCAL_HOSTS.includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHttp) {
        throw vendorError(field, 'must use https');
    }
    return raw;
};

const tryPublicKey = (der, type) => {
    try {
        return crypto.createPublicKey({ key: der, format: 'der', type });
    } catch {
        return null;
    }
};

const rsaPublicKey = (vendor) => {
    const text = vendorValue(vendor, 'publicKey').replace(/\\n/g, '\n');
    const block = text.match(PEM_BLOCK);
    const body = (block ? block[2] : text).replace(/\s+/g, '');
    const types = block ? [block[1] ? 'pkcs1' : 'spki'] : ['spki', 'pkcs1'];
    const key = /^[A-Za-z0-9+/]+={0,2}$/.test(body)
        ? types.map((type) => tryPublicKey(Buffer.from(body, 'base64'), type)).find(Boolean)
        : null;
    if (!key) {
        throw vendorError('publicKey', 'is not a valid public key');
    }
    if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048) {
        throw vendorError('publicKey', 'must be an RSA key of at least 2048 bits');
    }
    return key;
};

const tokenEncryptionKey = () => {
    const hex = process.env[TOKEN_KEY_ENV]?.trim();
    if (!hex) {
        throw new CtrlPayConfigError(`Missing ${TOKEN_KEY_ENV}`);
    }
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
        throw new CtrlPayConfigError(`${TOKEN_KEY_ENV} must be 64 hex characters`);
    }
    return Buffer.from(hex, 'hex');
};

const getCtrlPayConfig = async () => {
    const service = await findServiceOperatorByAccessKey(CTRLPAY_ACCESS_KEY);
    if (service.error) {
        throw new CtrlPayConfigError(`No service operator for access key ${CTRLPAY_ACCESS_KEY}`);
    }
    const vendor = service.vendor ?? {};
    const missing = Object.keys(VENDOR_COLUMNS).filter((field) => !vendorValue(vendor, field));
    if (missing.length) {
        throw new CtrlPayConfigError(`CTRLPay vendor is missing ${missing.map(columnLabel).join(', ')}`);
    }

    return {
        baseUrl: httpsUrl(vendor, 'baseUrl'),
        authDomain: httpsUrl(vendor, 'authDomain'),
        redirectUri: httpsUrl(vendor, 'redirectUri', { allowLocalHttp: true }),
        clientId: vendorValue(vendor, 'clientId'),
        partnerCode: vendorValue(vendor, 'partnerCode'),
        publicKey: rsaPublicKey(vendor),
        tokenKey: tokenEncryptionKey(),
    };
};

module.exports = { getCtrlPayConfig, CtrlPayConfigError };
