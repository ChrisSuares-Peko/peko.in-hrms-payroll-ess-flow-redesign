const { Op } = require('sequelize')
const cardholderKyc = require('../entities/cardholderKyc')
const asyncHandler = require('../../middlewares/async')
const { KYC_STATUS } = require('../../constants/kyc')

const findByMobile = asyncHandler(async (mobileNumber) =>
    cardholderKyc.findOne({ where: { mobileNumber: String(mobileNumber) } }))

/**
 * KYC for a set of mobiles, deliberately NOT scoped to the calling corporate.
 *
 * mobileNumber is the table's only UNIQUE, because KYC verifies a person against a handset rather than an
 * employment: one human has one row however many times they are invited. Scoping this by corporate sent a
 * newly invited employee, already verified under a previous employer or a previous identity, back through
 * video KYC — and the vendor would then refuse the duplicate. The caller already holds these mobiles, so
 * nothing is disclosed that it did not supply.
 */
const findByMobiles = asyncHandler(async (corporateId, mobileNumbers) => {
    const mobiles = [...new Set((mobileNumbers || []).filter(Boolean).map((m) => String(m).trim()))]
    if (!mobiles.length) return []
    return cardholderKyc.findAll({
        where: { mobileNumber: { [Op.in]: mobiles } },
        attributes: ['mobileNumber', 'kycStatus', 'userId'],
        order: [['id', 'ASC']],
        raw: true,
    })
})

/**
 * The KYC a cardholder is covered by, resolved by their identity and then by their handset.
 *
 * The handset fallback is what makes an already-verified person verified again the moment they are re-invited:
 * their row still carries whichever identity last claimed it, so an id-only lookup misses it. Passing
 * `mobileNumber` also CLAIMS a completed row for this cardholder, so every later id-keyed read finds it
 * without re-resolving. Claiming is best-effort — a failure costs a repeated lookup, never the caller.
 */
const findByCardholderUserId = asyncHandler(async ({ corporateId, userId, mobileNumber }) => {
    if (!corporateId || !userId) return null
    const options = {
        attributes: ['mobileNumber', 'kycStatus', 'userId'],
        order: [['id', 'DESC']],
        raw: true,
    }
    const completed = await cardholderKyc.findOne({
        ...options,
        where: { corporateId, userId, kycStatus: KYC_STATUS.COMPLETED },
    })
    if (completed) return completed

    const mobile = mobileNumber ? String(mobileNumber).trim() : ''
    if (mobile) {
        const byMobile = await cardholderKyc.findOne({ where: { mobileNumber: mobile } })
        if (byMobile && byMobile.kycStatus === KYC_STATUS.COMPLETED) {
            if (String(byMobile.userId ?? '') !== String(userId) || String(byMobile.corporateId ?? '') !== String(corporateId)) {
                try {
                    await byMobile.update({ userId, corporateId })
                } catch (err) {
                    // eslint-disable-next-line no-empty
                }
            }
            return { mobileNumber: byMobile.mobileNumber, kycStatus: byMobile.kycStatus, userId }
        }
    }

    return cardholderKyc.findOne({ ...options, where: { corporateId, userId } })
})

const findStalePending = asyncHandler(async ({ olderThan, statuses, limit }) =>
    cardholderKyc.findAll({
        where: {
            kycStatus: { [Op.in]: statuses },
            corporateId: { [Op.ne]: null },
            createdAt: { [Op.lt]: olderThan },
        },
        order: [['id', 'ASC']],
        limit,
    }))

const upsertByMobile = asyncHandler(async (mobileNumber, fields) => {
    const mobile = String(mobileNumber)
    const existing = await cardholderKyc.findOne({ where: { mobileNumber: mobile } })
    if (existing) {
        await existing.update(fields)
        return existing
    }
    try {
        return await cardholderKyc.create({ mobileNumber: mobile, ...fields })
    } catch (err) {
        if (err?.name !== 'SequelizeUniqueConstraintError') throw err
        const row = await cardholderKyc.findOne({ where: { mobileNumber: mobile } })
        if (row) await row.update(fields)
        return row
    }
})

const isEventNewer = (candidateTimestamp, existingTimestamp) => {
    if (!existingTimestamp || !candidateTimestamp) return true
    const candidate = new Date(candidateTimestamp)
    const existing = new Date(existingTimestamp)
    if (Number.isNaN(candidate.getTime()) || Number.isNaN(existing.getTime())) return true
    return candidate.getTime() >= existing.getTime()
}

const upsertByMobileIfNewer = asyncHandler(async (mobileNumber, fields) => {
    const mobile = String(mobileNumber)
    const existing = await cardholderKyc.findOne({ where: { mobileNumber: mobile } })
    // F-CC-05: ignore events timestamped far in the future — a forged far-future updatedOn would otherwise
    // win against (and permanently block) every later genuine callback.
    const candidate = new Date(fields.lastEventAt)
    if (!Number.isNaN(candidate.getTime()) && candidate.getTime() > Date.now() + 5 * 60 * 1000) {
        return { record: existing, applied: false }
    }
    if (existing && !isEventNewer(fields.lastEventAt, existing.lastEventAt)) {
        return { record: existing, applied: false }
    }
    const record = await upsertByMobile(mobile, fields)
    return { record, applied: true }
})

/**
 * KYC rows for the admin Corporate Card Lookup: everything filed under the corporate, plus any row its
 * members' handsets are covered by (see findByMobiles for why KYC is keyed by mobile, not employment).
 * Unlike the member-facing reads, this carries the rejection reason and when the status last moved.
 */
const findForCorporateLookup = asyncHandler(async ({ corporateId, mobileNumbers }) => {
    const mobiles = [...new Set((mobileNumbers || []).filter(Boolean).map((m) => String(m).trim()))]
    const or = [{ corporateId }]
    if (mobiles.length) or.push({ mobileNumber: { [Op.in]: mobiles } })
    return cardholderKyc.findAll({
        where: { [Op.or]: or },
        attributes: ['mobileNumber', 'kycStatus', 'reason', 'userId', 'corporateId', 'updatedAt'],
        order: [['id', 'ASC']],
        raw: true,
    })
})

// TEMPORARY (master-admin KYC reset tooling) — paginated rows by status, mobile-searchable.
const findAndCountByStatus = asyncHandler(async ({ kycStatus, searchText, limit, offset }) => {
    const where = { kycStatus }
    if (searchText && searchText.trim()) {
        // Escape LIKE metacharacters (\ % _) so the input matches literally.
        const escaped = searchText.trim().replace(/[\\%_]/g, '\\$&')
        where.mobileNumber = { [Op.like]: `%${escaped}%` }
    }
    return cardholderKyc.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset, raw: true })
})

const findById = asyncHandler(async (id) => cardholderKyc.findOne({ where: { id }, raw: true }))

// TEMPORARY (master-admin KYC reset tooling) — hard-deletes one KYC row so the member can re-run KYC
// after their data is reset on the Pine Labs side. Returns the affected count.
const deleteById = asyncHandler(async (id) => cardholderKyc.destroy({ where: { id } }))

module.exports = {
    findForCorporateLookup,
    findByMobile,
    findByMobiles,
    findByCardholderUserId,
    findStalePending,
    upsertByMobile,
    upsertByMobileIfNewer,
    isEventNewer,
    findAndCountByStatus, 
    findById, 
    deleteById
}
