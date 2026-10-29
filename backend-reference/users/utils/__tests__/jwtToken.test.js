process.env.ISSUER = process.env.ISSUER || 'peko'
process.env.SUBJECT = process.env.SUBJECT || 'reach@peko.one'
process.env.AUDIENCE = process.env.AUDIENCE || 'https://peko.one'
process.env.ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1h'
process.env.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '2h'

const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { signToken, signRefreshToken } = require('../jwtToken')

const publicKey = fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'rsa.key.pub'), 'utf8')

const decode = (token) => jwt.verify(token, publicKey, {
    issuer: process.env.ISSUER,
    subject: process.env.SUBJECT,
    audience: process.env.AUDIENCE,
    algorithms: ['RS256'],
})

// A sub-user's cached session carries roleName='corporate sub user' + subCorporateId (see login.js).
// Without these on the signed token, /refresh-token can't tell a sub-user apart from a plain corporate
// login when it decodes the refresh token, so it silently drops subCorporateId from the re-cached
// session — the next cardholder-only request (issue card, limit increase, ...) then 403s with
// "This action is available to cardholders only." (requireCardholder.js).
describe('signToken', () => {
    it('carries roleName and subCorporateId through for a sub-user session', async () => {
        const token = await signToken({
            username: 'faris',
            role: 'CORPORATE',
            id: 42,
            roleName: 'corporate sub user',
            subCorporateId: 7,
        })

        const decoded = decode(token)

        expect(decoded.roleName).toBe('corporate sub user')
        expect(decoded.subCorporateId).toBe(7)
        expect(decoded.userId).toBe(42)
        expect(decoded.type).toBe('token')
    })

    it('leaves roleName/subCorporateId undefined for a plain (non-sub-user) login', async () => {
        const token = await signToken({ username: 'admin', role: 'CORPORATE', id: 1 })

        const decoded = decode(token)

        expect(decoded.roleName).toBeUndefined()
        expect(decoded.subCorporateId).toBeUndefined()
    })
})

describe('signRefreshToken', () => {
    it('carries roleName and subCorporateId through for a sub-user session', async () => {
        const token = await signRefreshToken({
            username: 'faris',
            role: 'CORPORATE',
            id: 42,
            roleName: 'corporate sub user',
            subCorporateId: 7,
        })

        const decoded = decode(token)

        expect(decoded.roleName).toBe('corporate sub user')
        expect(decoded.subCorporateId).toBe(7)
        expect(decoded.type).toBe('refreshToken')
    })
})
