/* eslint-disable no-undef */
const CryptoJS = require('crypto-js');

function encrypt(text, password) {
    // Fixed IV for consistent encryption output
    const iv = CryptoJS.enc.Hex.parse('000102030405060708090a0b0c0d0e0f');

    // Derive a key using PBKDF2
    const key = CryptoJS.PBKDF2(password, iv, { keySize: 256 / 32, iterations: 1000 });

    const encrypted = CryptoJS.AES.encrypt(text, key, { iv: iv }).toString();
    return encrypted;
}

function decrypt(encrypted, password) {
    // Fixed IV for consistent decryption
    const iv = CryptoJS.enc.Hex.parse('000102030405060708090a0b0c0d0e0f');

    // Derive the key using PBKDF2
    const key = CryptoJS.PBKDF2(password, iv, { keySize: 256 / 32, iterations: 1000 });

    const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function queryStringIntoBase64(status, txnId) {
    const encodedQueryParams = Buffer.from(`status="${status}"&transactionId=${txnId}`).toString('base64')
    return encodedQueryParams
}

const cryptoJSEncryption = {
    encrypt,
    decrypt,
    queryStringIntoBase64
};

module.exports = cryptoJSEncryption;
