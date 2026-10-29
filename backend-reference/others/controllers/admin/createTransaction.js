const {
    createManualWalletTransaction,
} = require('../../utils/walletTransaction')
const asyncHandler = require('./../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const {  fetchServiceOperatorTelecomAndUtility } = require('../../models/use-cases/serviceOperator');
const { verifyOtp } = require('../../models/use-cases/otp');
const { resolvePartnerScope } = require('../../utils/partnerScope');
const corporateUserEntity = require('../../models/entities/corporateUser');
const { findOne: findOneSystemUser } = require('../../models/use-cases/systemUser');
const { acquireIdempotencyKey, releaseIdempotencyKey } = require('../../utils/idempotency');

exports.createTransaction = asyncHandler(async (req, res, next) => {

    const credentialId = req.body.corporateId
    const corporateName = req.body.corporateName
    const amount = req.body.rechargeAmount
    const surcharge = req.body.surcharge
    const account = req.body.accountNo
    const service = req.body.service
    const merchantCommission = req.body.merchantCommission
    const adminCommission = req.body.adminCommission
    const transactionId = req.body.transactionId
    const orderId = req.body.orderId
    const providerId = req.body.providerId
    let serviceOperatorId = req.body.serviceOperatorId
    let categoryName = req.body.categoryName
    let remarks = req.body.remarks ? req.body.remarks : ''
    serviceOperatorId = parseInt(serviceOperatorId)
    const adminCredentialId = req.user.id ?? 1 //credential id of admin

    // F-OTH-09/18: dedup a double-submitted/retried request before doing anything else.
    const idempotencyKey = req.headers['idempotency-key']
    if (!idempotencyKey) {
        return res.status(400).json({ status: false, message: 'Idempotency-Key header is required.', data: {}, responseCode: '001' })
    }
    const idempotencyScope = `createTransaction:${req.user.id}`
    const isFreshRequest = await acquireIdempotencyKey(idempotencyScope, idempotencyKey)
    if (!isFreshRequest) {
        return res.status(409).json({ status: false, message: 'Duplicate request — this transaction was already submitted.', data: {}, responseCode: '001' })
    }

    try {
        // F-OTH-09: restrict the target wallet to a corporate within the caller's own partner scope.
        const scope = resolvePartnerScope(req)
        if (scope.locked) {
            const targetCorporate = await corporateUserEntity.findOne({
                where: { credentialId },
                attributes: ['registeredBy'],
            })
            if (!targetCorporate || String(targetCorporate.registeredBy) !== String(scope.partnerId)) {
                await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
                return next(new ErrorResponse(`Unauthorized access to this corporate's wallet`, 403))
            }
        }

        // F-OTH-18: OTP is now mandatory for this money-movement endpoint. req.user.email can
        // be empty on some cached sessions (mirrors the same fallback order.js's getOtp already
        // uses) — falling back to a fresh DB lookup avoids matching the wrong OTP record.
        let email = req.user.email
        if (!email) {
            const result = await findOneSystemUser(req.user)
            email = result.email
        }
        let otpResponse = await verifyOtp({ contact: email, otp: req.body.otp })
        if (otpResponse.isVerified === false) {
            await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
            return res.status(401).json({ status: false, message: otpResponse.message, data: {}, responseCode: '001' })
        }

        const transactionResponse = await createManualWalletTransaction({
            credentialId ,
             corporateName,
             amount,
             account ,
             service ,
             merchantCommission ,
             adminCommission ,
             transactionId ,
             orderId ,
             providerId ,
             adminCredentialId ,
             serviceOperatorId,
             categoryName,
             remarks,
             surcharge
        })

        if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
            await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
            return next(new ErrorResponse(transactionResponse['error'], 200))
        }

        return res.status(200).json({
            'status': true,
            'message' : "Transaction successfully created",
            'data': {
                ...transactionResponse
            },
            'responseCode' : '000'
        })
    } catch (err) {
        await releaseIdempotencyKey(idempotencyScope, idempotencyKey)
        throw err
    }
})

exports.fetchServiceOperator = asyncHandler(async (req, res, next) => {
    const { searchText } = req.query;
    let result = await fetchServiceOperatorTelecomAndUtility(searchText)
    
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {data:result},
            'message' : 'Service operator fetched successfully.' ,
            'responseCode' : '000'
        })
    }
})