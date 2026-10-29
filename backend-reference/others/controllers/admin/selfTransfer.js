const {selfTransfer} = require('../../utils/walletTransaction')
const {authenticate} = require('../../utils/validatePassword')
const {verifyOtp} = require('../../models/use-cases/otp')
const {findOne: findOneSystemUser} = require('../../models/use-cases/systemUser')
const {acquireIdempotencyKey, releaseIdempotencyKey} = require('../../utils/idempotency')

exports.selfTransfer = async (req, res) => {
    const data = req.body
    // F-OTH-09/18: dedup a double-submitted/retried request before doing anything else.
    const idempotencyKey = req.headers['idempotency-key']
    if (!idempotencyKey) {
        return res.status(400).json({ status: false, message: 'Idempotency-Key header is required.', data: {}, responseCode: '001' })
    }
    const idempotencyScope = `selfTransfer:${req.user.id}`

    try {
        if(req.user.id != data.credentialId){
            return res.status(401).json({
                status: false,
                message: "Unauthorized access",
                data:{},
                responseCode: "997"
            })
        }

        const isFreshRequest = await acquireIdempotencyKey(idempotencyScope, idempotencyKey)
        if (!isFreshRequest) {
            return res.status(409).json({
                status: false,
                message: 'Duplicate request — this transfer was already submitted.',
                data: {},
                responseCode: '001'
            })
        }

        // F-OTH-18: OTP is now mandatory for this money-movement endpoint. req.user.email
        // can be empty on some cached sessions (mirrors the same fallback order.js's getOtp
        // already uses) — falling back to a fresh DB lookup avoids matching the wrong OTP record.
        let email = req.user.email
        if (!email) {
            const result = await findOneSystemUser(req.user)
            email = result.email
        }
        let otpResponse = await verifyOtp({ contact: email, otp: data.otp })
        if (otpResponse.isVerified === false) {
            await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
            return res.status(401).json({
                status: false,
                message: otpResponse.message,
                data: {},
                responseCode: "996"
            })
        }

        let isAuthenticated = await authenticate({credentialId:data.credentialId, password:data.password})
        if (!isAuthenticated) {
            await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
            return res.status(401).json({
                status: false,
                message: "Invalid userId or Password",
                data:{},
                responseCode: "998"
            })
        } else {
            let result = await selfTransfer(data)
            return res.json({
                status: true,
                message: 'Self Transfer Successful!',
                data: {
                    finalBalance:result
                },
                responseCode: '000',
            })
        }
    } catch (e) {
        console.log(e.message)
        await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
        return res.status(500).json({
                status: false,
                message: "INTERNAL SERVER ERROR",
                data:{},
                responseCode: "999"
        })
    }
};