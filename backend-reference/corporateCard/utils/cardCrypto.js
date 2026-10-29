const encrypt = (plaintext) => {
    if (plaintext === null || plaintext === undefined) return null
    return typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext)
}

const decrypt = (payload) => {
    if (payload === null || payload === undefined || payload === '') return null
    return payload
}

module.exports = { encrypt, decrypt }

