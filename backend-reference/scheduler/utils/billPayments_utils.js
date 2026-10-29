const crypto = require('crypto');

function generateRequestId() {
    const randomString = [...Array(27)].map(() => Math.random().toString(36)[2]).join("");
    const now = new Date();
    const yearLastDigit = String(now.getFullYear()).slice(-1);
    const dayOfYear = String(Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 86400000)).padStart(3, "0");
    const time = now.toTimeString().slice(0, 5).replace(":", "");
    return `${randomString}${yearLastDigit}${dayOfYear}${time}`;
  }
  
  
  function encrypt(plainText, key) {
    const keyHash = crypto.createHash('md5').update(key).digest('hex');
    const encryptionKey = Buffer.from(keyHash, 'hex');
    const initVector = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    
    const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, initVector);
    let encryptedText = cipher.update(plainText, 'utf8', 'hex');
    encryptedText += cipher.final('hex');
    return encryptedText;
  }
  
  function decrypt(encryptedText, key) {
    const keyHash = crypto.createHash('md5').update(key).digest('hex');
    const decryptionKey = Buffer.from(keyHash, 'hex');
    const initVector = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    
    const decipher = crypto.createDecipheriv('aes-128-cbc', decryptionKey, initVector);
    let decryptedText = decipher.update(encryptedText, 'hex', 'utf8');
    decryptedText += decipher.final('utf8');
    return decryptedText;
  }

  module.exports = { generateRequestId, encrypt, decrypt };