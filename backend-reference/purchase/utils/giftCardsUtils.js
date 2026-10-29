
const CryptoJS = require("crypto-js");

function encrypt(plainText, keyHex) {
    // MUST trim
    plainText = plainText.trim();

    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv  = CryptoJS.enc.Hex.parse(keyHex);

    const encrypted = CryptoJS.AES.encrypt(
        plainText,
        key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    return encrypted.toString(); // Base64
}
  
 function decrypt(cipherText, keyHex) {
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv  = CryptoJS.enc.Hex.parse(keyHex);

    const decrypted = CryptoJS.AES.decrypt(
        cipherText,
        key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
}


  module.exports = {  encrypt, decrypt };