const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const {
    findAndCountCardUsers,
    findKycByUserIds,
    findKycByMobiles,
    findIssuanceByUserIds,
} = require('../../models/use-cases/cardUser')
const { CARD_STATUS, CARD_STATE } = require('../../constants/card')
const { KYC_STATUS } = require('../../constants/kyc')
const { actsAsOwner, parsePaging, cardholderIdentity } = require('../../utils/cardHelpers')
const { ROLE_NAMES } = require('../../utils/cardRoles')

const KYC_NOT_STARTED = 'NOT_STARTED'
const KYC_FILTER_VALUES = [...Object.values(KYC_STATUS), KYC_NOT_STARTED]
const MEMBER_CARD_STATUS = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', NONE: 'NONE' }

exports.listCardUsers = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) {
        return next(new ErrorResponse('Corporate context is missing.', 400))
    }

    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const searchText = typeof req.query.searchText === 'string' ? req.query.searchText : undefined
    const { limit, offset } = parsePaging(req)

    const rawKyc = typeof req.query.kycStatus === 'string' ? req.query.kycStatus.trim().toUpperCase() : ''
    if (rawKyc && !KYC_FILTER_VALUES.includes(rawKyc)) {
        return next(new ErrorResponse('Invalid kycStatus filter.', 400))
    }
    const kycStatus = rawKyc || undefined

    const includeOwner = actsAsOwner(req)
    const self = includeOwner ? null : cardholderIdentity(req)
    const { count, rows } = await findAndCountCardUsers({
        corporateId,
        status,
        searchText,
        kycStatus,
        includeOwner,
        pinUserId: self?.userId ?? undefined,
        limit,
        offset,
        req,
    })

    const userIds = rows.map((row) => row.id)

    const [kycRows, kycByMobileRows, issuanceRows] = await Promise.all([
        findKycByUserIds(userIds),
        findKycByMobiles(corporateId, rows.map((row) => row.mobileNo)),
        findIssuanceByUserIds(userIds, corporateId),
    ])
    const kycByUser = new Map(kycRows.map((k) => [String(k.userId), k.kycStatus]))
    const normalisedMobile = (value) => (value ? String(value).trim() : '')
    const kycByMobile = new Map(
        kycByMobileRows.map((k) => [normalisedMobile(k.mobileNumber), k.kycStatus])
    )
    const cardStatusByUser = new Map()
    const cardCountByUser = new Map()
    for (const issuance of issuanceRows) {
        if (issuance.status !== CARD_STATUS.ISSUED) continue
        const key = String(issuance.userId)
        cardCountByUser.set(key, (cardCountByUser.get(key) || 0) + 1)
        if (issuance.cardState !== CARD_STATE.FROZEN) {
            cardStatusByUser.set(key, MEMBER_CARD_STATUS.ACTIVE)
        } else if (cardStatusByUser.get(key) !== MEMBER_CARD_STATUS.ACTIVE) {
            cardStatusByUser.set(key, MEMBER_CARD_STATUS.INACTIVE)
        }
    }

    const data = rows.map((row) => {
        const key = String(row.id)
        const isAccountOwner = row.isAccountOwner === 1 || row.isAccountOwner === true
        const isSelf = isAccountOwner || row.isSelf === 1 || row.isSelf === true
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            mobileNo: row.mobileNo,
            role: isAccountOwner ? ROLE_NAMES.ADMIN : row.role,
            isAccountOwner,
            isSelf,
            status: row.status,
            hasSetPassword: row.hasSetPassword === 1 || row.hasSetPassword === true,
            kycStatus: kycByMobile.get(normalisedMobile(row.mobileNo)) || kycByUser.get(key) || KYC_NOT_STARTED,
            cardStatus: cardStatusByUser.get(key) || MEMBER_CARD_STATUS.NONE,
            cardCount: cardCountByUser.get(key) || 0,
            joined: row.createdAt,
        }
    })

    return res.status(200).json({
        status: true,
        message: 'Card users fetched successfully.',
        data: { count, rows: data },
        responseCode: '000',
    })
})
