const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { GENERIC_ERROR } = require('../../constants/messages')
const { KYC_STATUS } = require('../../constants/kyc')
const { CARD_STATE, CARD_STATUS } = require('../../constants/card')
const { CARD_TYPE, CARD_REQUEST_TYPE, CARD_REQUEST_STATUS } = require('../../constants/cardRequest')
const { MOBILE_REGEX, rowCardholderIdentity } = require('../../utils/cardHelpers')
const { findByIdScoped, findBlockingIssuance } = require('../../models/use-cases/cardIssuance')
const { findByIdScoped: findRequestScoped } = require('../../models/use-cases/cardRequest')
const { findByCorporate: findCorporateApplication } = require('../../models/use-cases/corporateCardAdminApplication')
const { findByCardholderUserId: findCardholderKyc } = require('../../models/use-cases/cardholderKyc')
const { findCardholderByIdentity } = require('../../utils/sharedDirectory')

const refuse = (reason, message) => ({ ok: false, reason, message })

const isIdLike = (value) =>
    value !== undefined && value !== null && value !== '' && /^\d+$/.test(String(value).trim())

const evaluate = async (req) => {
    const corporateId = req.user?.corporateId
    const body = req.body || {}

    if (!isIdLike(body.cardIssuanceId)) {
        return refuse('NO_SOURCE_CARD', 'Choose the card this physical card is for.')
    }

    const source = await findByIdScoped(String(body.cardIssuanceId).trim(), corporateId)
    if (!source || !source.referenceNumber) {
        return refuse('SOURCE_UNUSABLE', 'That card cannot be converted to a physical card.')
    }
    if (source.cardType === CARD_TYPE.PHYSICAL) {
        return refuse('ALREADY_PHYSICAL', 'This card is already a physical card.')
    }
    if (source.status !== CARD_STATUS.ISSUED) {
        return refuse('SOURCE_NOT_ACTIVE', 'You can only order a physical card for an active card.')
    }
    if ((source.cardState || CARD_STATE.ACTIVE) !== CARD_STATE.ACTIVE) {
        return refuse('SOURCE_FROZEN', 'You cannot order a physical card for a frozen card.')
    }

    if (body.cardRequestId !== undefined && body.cardRequestId !== null && body.cardRequestId !== '') {
        if (!isIdLike(body.cardRequestId)) {
            return refuse('REQUEST_UNUSABLE', 'This request can no longer be used to order a physical card.')
        }
        const request = await findRequestScoped(Number(String(body.cardRequestId).trim()), corporateId)
        const belongsHere = request
            && request.requestType === CARD_REQUEST_TYPE.CARD_ISSUANCE
            && request.payload?.cardType === CARD_TYPE.PHYSICAL
            && String(request.cardIssuanceId) === String(source.id)
        if (!belongsHere) {
            return refuse('REQUEST_UNUSABLE', 'This request is not a physical card request for that card.')
        }
        if (request.status !== CARD_REQUEST_STATUS.PENDING) {
            return refuse('REQUEST_DECIDED', 'This request has already been decided.')
        }
    }

    const customerName = (source.nameOnCard || '').trim()
    if (!customerName || customerName.length > 50) {
        return refuse('NO_CARDHOLDER_NAME', 'This card has no usable cardholder name to print on a physical card.')
    }

    // The handset is what resolves an already-verified person: their KYC row still carries whichever
    // identity last claimed it, so an id-only lookup would send them back through video KYC.
    let holderMobile = null
    try {
        holderMobile = (await findCardholderByIdentity(rowCardholderIdentity(source), req))?.mobileNo ?? null
    } catch (err) {
        // eslint-disable-next-line no-empty
    }
    const kyc = await findCardholderKyc({ corporateId, userId: source.userId, mobileNumber: holderMobile })
    const mobile = kyc?.mobileNumber ? String(kyc.mobileNumber) : ''
    if (!mobile || !MOBILE_REGEX.test(mobile)) {
        return refuse(
            'NO_CARDHOLDER_MOBILE',
            'The cardholder has no valid mobile number on their KYC record, so a physical card cannot be ordered.'
        )
    }
    if (kyc.kycStatus !== KYC_STATUS.COMPLETED) {
        return refuse('KYC_INCOMPLETE', 'The cardholder has not completed KYC yet, so a physical card cannot be ordered.')
    }

    const application = await findCorporateApplication(corporateId)
    if (!application?.cardSchemeId) {
        return refuse('NO_CARD_SCHEME', GENERIC_ERROR)
    }

    const blocking = await findBlockingIssuance({
        cardholder: rowCardholderIdentity(source),
        cardType: CARD_TYPE.PHYSICAL,
        sourceCardIssuanceId: source.id,
    })
    if (blocking) {
        return refuse('PENDING', 'A physical card for this card is already in progress or already exists.')
    }

    return { ok: true, reason: null, message: null }
}

exports.preflightPhysicalCardOrder = asyncHandler(async (req, res, next) => {
    if (!req.user?.corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const result = await evaluate(req)

    return res.status(200).json({
        status: true,
        message: 'Physical card order checked.',
        data: result,
        responseCode: '000',
    })
})
