const { Op } = require('sequelize')
const asyncHandler = require('../../middlewares/async')
const cardholderKyc = require('../entities/cardholderKyc')
const { findByMobiles } = require('./cardholderKyc')
const cardIssuance = require('../entities/cardIssuance')
const sharedDirectory = require('../../utils/sharedDirectory')
const { customLog } = require('../../utils/loggerHelper')
const { KYC_STATUS } = require('../../constants/kyc')

const KYC_NOT_STARTED = 'NOT_STARTED'

const KYC_FILTER_IDS_MAX = 500

const capKycFilterIds = (ids, corporateId, kycStatus, req) => {
    if (ids.length <= KYC_FILTER_IDS_MAX) return ids
    customLog(req?.LogTraceId, 'error', {
        message: '[CardUsers] kycStatus filter id list was capped — results may undercount',
        corporateId,
        kycStatus,
        total: ids.length,
        cap: KYC_FILTER_IDS_MAX,
    }, 'CONSOLE')
    return ids.slice(0, KYC_FILTER_IDS_MAX)
}

const normalisedMobile = (value) => (value ? String(value).trim() : '')

/**
 * Each of the corporate's members paired with the KYC state the People table would show them in.
 *
 * Resolved over the MEMBER list — mobile first, id as the fallback — and not by querying `cardholderKyc` for
 * rows that carry a userId. The vendor's KYC callback identifies a person by handset alone: it knows neither
 * the corporate nor the employee, so a row it creates before any session write has `userId` and `corporateId`
 * NULL. Filtering on those two columns therefore hid exactly the people whose KYC had completed, while the
 * same screen's KYC column — which resolves by mobile — went on showing them as Completed.
 *
 * `mobileNumber` is the table's only UNIQUE, so there is one row per handset and no latest-row question on
 * that axis; the id-keyed rows come back ordered so the Map keeps the most recent.
 */
const memberKycStates = async ({ corporateId, includeOwner, req }) => {
    const members = await sharedDirectory.listCardUserIdentities({ includeOwner, req })
    if (!members.length) return []

    const mobiles = members.map((m) => m.mobileNo).filter(Boolean)
    const [kycRows, kycByMobileRows] = await Promise.all([
        findKycByUserIds(members.map((m) => m.id)),
        mobiles.length ? findByMobiles(corporateId, mobiles) : Promise.resolve([]),
    ])

    const kycById = new Map(kycRows.map((k) => [String(k.userId), k.kycStatus]))
    const kycByMobile = new Map(kycByMobileRows.map((k) => [normalisedMobile(k.mobileNumber), k.kycStatus]))

    return members.map((m) => ({
        id: String(m.id),
        kycStatus: kycByMobile.get(normalisedMobile(m.mobileNo)) || kycById.get(String(m.id)) || KYC_NOT_STARTED,
    }))
}

const findAndCountCardUsers = asyncHandler(async ({ corporateId, status, searchText, kycStatus, includeOwner = false, pinUserId, limit, offset, req }) => {
    if (!kycStatus) {
        return sharedDirectory.findAndCountCardUsers({ status, searchText, includeOwner, pinUserId, limit, offset, req })
    }

    const states = await memberKycStates({ corporateId, includeOwner, req })
    const matched = states.filter((m) => m.kycStatus === kycStatus).map((m) => m.id)
    if (!matched.length) return { count: 0, rows: [] }

    // Named by its complement only when naming it directly would be truncated, and only when the complement
    // is not. Both describe the same set, so this costs nothing — but NOT_STARTED is the majority on a young
    // account, and it used to be sent as an exclusion, so sending it positively would newly hit the cap on a
    // corporate where the old code never did.
    const excluded = states.filter((m) => m.kycStatus !== kycStatus).map((m) => m.id)
    if (matched.length > KYC_FILTER_IDS_MAX && excluded.length <= KYC_FILTER_IDS_MAX) {
        return sharedDirectory.findAndCountCardUsers({
            status, searchText, excludeIds: excluded, includeOwner, pinUserId, limit, offset, req,
        })
    }

    return sharedDirectory.findAndCountCardUsers({
        status,
        searchText,
        ids: capKycFilterIds(matched, corporateId, kycStatus, req),
        includeOwner,
        pinUserId,
        limit,
        offset,
        req,
    })
})

const findKycByMobiles = asyncHandler(async (corporateId, mobileNumbers) =>
    findByMobiles(corporateId, mobileNumbers))

const findKycByUserIds = asyncHandler(async (userIds) => {
    if (!userIds.length) return []
    return cardholderKyc.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: ['userId', 'kycStatus'],
        order: [['id', 'ASC']],
        raw: true,
    })
})

const findIssuanceByUserIds = asyncHandler(async (userIds, corporateId) => {
    if (!userIds.length) return []
    return cardIssuance.findAll({
        where: {
            userId: { [Op.in]: userIds },
            ...(corporateId ? { corporateId } : {}),
        },
        attributes: ['userId', 'status', 'cardState'],
        raw: true,
    })
})

const findCardholderById = asyncHandler(async (userId, req) =>
    sharedDirectory.findCardholderById(userId, req))

/**
 * One cardholder, scoped to the caller's corporate.
 *
 * Takes EITHER a bare `userId` (an admin naming a member) or a row's `cardholder` identity, and must forward
 * whichever it was given. Dropping `cardholder` here resolved nothing for every caller that holds a row
 * rather than an id — both approval paths and the physical-card issue — and each reported it as "Cardholder
 * not found", which reads as a missing member rather than a lost argument.
 */
const findCardUserScoped = asyncHandler(async ({ userId, cardholder, req }) =>
    sharedDirectory.findCardUserScoped({ userId, cardholder, req }))

/**
 * `includeOwner` is passed in rather than derived from `req` here. Importing actsAsOwner from cardHelpers
 * closed a require cycle — cardHelpers needs findCardholderById from this module — so the destructured
 * binding was undefined at load time and this function threw "actsAsOwner is not a function" on its first
 * line, every time, for every corporate. The dashboard swallowed that and rendered 0/0.
 */
const getKycSummary = asyncHandler(async ({ corporateId, includeOwner = false, req }) => {
    // Shares memberKycStates with the People filter on purpose: when the KPI resolved KYC one way and the
    // filter another, the tile counted people the list beside it could not produce.
    const states = await memberKycStates({ corporateId, includeOwner, req })
    const total = states.length
    if (!total) return { total: 0, verified: 0, pending: 0 }

    const verified = states.filter((m) => m.kycStatus === KYC_STATUS.COMPLETED).length
    return { total, verified, pending: total - verified }
})

module.exports = { findAndCountCardUsers, findKycByUserIds, findKycByMobiles, findIssuanceByUserIds, findCardholderById, findCardUserScoped, getKycSummary }
