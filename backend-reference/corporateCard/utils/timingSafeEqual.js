const crypto = require('crypto')

// F-CC-14: constant-time secret comparison. SHA-256 both sides first so unequal lengths don't throw or
// leak length via timing; timingSafeEqual then compares the fixed-size digests.
const timingSafeEqual = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false
    const ah = crypto.createHash('sha256').update(a).digest()
    const bh = crypto.createHash('sha256').update(b).digest()
    return crypto.timingSafeEqual(ah, bh)
}

module.exports = { timingSafeEqual }
