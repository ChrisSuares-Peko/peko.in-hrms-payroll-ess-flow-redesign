// F-PAY-32: dead encrypt helper (used nowhere; random per-process key, logs plaintext) — commented out, not removed.
/*
const aes256 = require('aes256');
const  key = (Math.random() + 1).toString(36).substring(7);
exports.encryptedPlainText = function (plaintext){
    console.log(plaintext)
    return aes256.encrypt(key, plaintext)
};
exports.decryptedPlainText = function (encryptedPlainText) {
    return aes256.decrypt(key, encryptedPlainText);
}
*/
