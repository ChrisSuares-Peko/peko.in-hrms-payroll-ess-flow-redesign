const { transferFunds } = require('../../utils/walletTransaction')
const { authenticate } = require('../../utils/validatePassword')
const { verifyOtp } = require('../../models/use-cases/otp')
const { resolvePartnerScope } = require('../../utils/partnerScope')
const corporateUserEntity = require('../../models/entities/corporateUser')
const { findOne: findOneSystemUser } = require('../../models/use-cases/systemUser')
const { acquireIdempotencyKey, releaseIdempotencyKey } = require('../../utils/idempotency')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')

exports.transferFunds = asyncHandler(async (req, res, next) => {
    const data = req.body
    data.registeredById = req.user.id
    data.registeredByname = req.user.name

    // F-OTH-09/18: dedup a double-submitted/retried request before doing anything else.
    const idempotencyKey = req.headers['idempotency-key']
    if (!idempotencyKey) {
        return res.status(400).json({ status: false, message: 'Idempotency-Key header is required.', data: {}, responseCode: '001' })
    }
    const idempotencyScope = `transferFunds:${req.user.id}`
    const isFreshRequest = await acquireIdempotencyKey(idempotencyScope, idempotencyKey)
    if (!isFreshRequest) {
        return res.status(409).json({ status: false, message: 'Duplicate request — this transfer was already submitted.', data: {}, responseCode: '001' })
    }

    try {
        // F-OTH-09: restrict the target wallet to a corporate within the caller's own partner
        // scope — previously any admin could move money into/out of any corporate's wallet
        // regardless of which partner it actually belongs to.
        const scope = resolvePartnerScope(req)
        if (scope.locked) {
            const targetCorporate = await corporateUserEntity.findOne({
                where: { credentialId: data.credentialId },
                attributes: ['registeredBy'],
            })
            if (!targetCorporate || String(targetCorporate.registeredBy) !== String(scope.partnerId)) {
                await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
                return next(new ErrorResponse(`Unauthorized access to this corporate's wallet`, 403))
            }
        }

        // F-OTH-18: OTP is now mandatory for this money-movement endpoint, on top of the
        // existing password re-auth. req.user.email can be empty on some cached sessions
        // (mirrors the same fallback order.js's getOtp already uses) — falling back to a
        // fresh DB lookup avoids matching the wrong (or a stale placeholder) OTP record.
        let email = req.user.email
        if (!email) {
            const result = await findOneSystemUser(req.user)
            email = result.email
        }
        let otpResponse = await verifyOtp({ contact: email, otp: data.otp })
        if (otpResponse.isVerified === false) {
            await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
            return res.status(401).json({ status: false, message: otpResponse.message, data: {}, responseCode: '001' })
        }

        let isAuthenticated = await authenticate({ credentialId: req.user.id, password: data.password })
        if (!isAuthenticated) {
            await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
            return next(new ErrorResponse(`Invalid password`, 401))
        }

        let result = await transferFunds(data)
        return res.status(200).json({
            'status': true,
            'message': `${data.amount} INR has been transfered successfully`,
            'data': result,
            'responseCode': '000'
        })
    } catch (err) {
        await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
        throw err
    }
})

