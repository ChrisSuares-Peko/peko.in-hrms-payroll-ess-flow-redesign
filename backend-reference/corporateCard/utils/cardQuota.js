const { countPhysicalCardsUsed, countPaidPhysicalCards } = require('../models/use-cases/cardIssuance')
const { physicalCardMessage } = require('../constants/cardQuota')

const resolveCardBaseLimit = (serviceDetails) => {
    const raw = serviceDetails?.baseLimit
    if (raw === null || raw === undefined || raw === '') return 0
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) return 0
    return Math.floor(parsed)
}

const resolveCardUnitPrice = (serviceDetails) => {
    const raw = serviceDetails?.unitPrice
    if (raw === null || raw === undefined || raw === '') return 0
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) return 0
    return Math.round(parsed * 100) / 100
}

const buildPhysicalQuota = ({ baseLimit, purchased, used, unitPrice }) => {
    const allowed = baseLimit + purchased
    return {
        used,
        included: baseLimit,
        purchased,
        allowed,
        remaining: Math.max(allowed - used, 0),
        requiresPayment: used >= allowed,
        unitPrice,
        purchasable: unitPrice > 0,
    }
}

const resolvePhysicalCardQuota = async ({ corporateId, baseLimit, unitPrice }, transaction) => {
    const [used, purchased] = await Promise.all([
        countPhysicalCardsUsed({ corporateId }, transaction),
        countPaidPhysicalCards({ corporateId }, transaction),
    ])
    return buildPhysicalQuota({ baseLimit, purchased, used, unitPrice })
}

const assertPhysicalCardAllowed = async ({ corporateId, baseLimit, unitPrice }, transaction) => {
    const quota = await resolvePhysicalCardQuota({ corporateId, baseLimit, unitPrice }, transaction)
    if (!quota.requiresPayment) return { ok: true, ...quota }
    return { ok: false, ...quota, message: physicalCardMessage(quota) }
}

module.exports = {
    resolveCardBaseLimit,
    resolveCardUnitPrice,
    buildPhysicalQuota,
    resolvePhysicalCardQuota,
    assertPhysicalCardAllowed,
}
