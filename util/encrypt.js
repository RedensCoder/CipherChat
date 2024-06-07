const crypto = require('crypto');

const encrypt = (publicKey, text) => {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
}

const decrypt = (privateKey, encryptedText) => {
    const buffer = Buffer.from(encryptedText, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
}

module.exports = {
    encrypt,
    decrypt
}