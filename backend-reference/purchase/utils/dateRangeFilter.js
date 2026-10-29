const { Op } = require("sequelize")

/**
 * Apply a createdAt window to a Sequelize `where`.
 *
 * `to` is a bare date (e.g. "2026-07-24") — `new Date(to)` alone resolves to
 * that day's midnight, silently excluding every row created LATER that same
 * day (e.g. an issue raised minutes ago, with `to` defaulting to today).
 * End-cap it to the last instant of the day instead.
 *
 * Absent/empty `from` and `to` leave `where` untouched, so a cleared date
 * filter means "no window" rather than an empty result.
 */
const applyCreatedAtRange = (where, from, to) => {
    if (!from && !to) return where
    where.createdAt = {}
    if (from) where.createdAt[Op.gte] = new Date(from)
    if (to) {
        const endOfDay = new Date(to)
        endOfDay.setHours(23, 59, 59, 999)
        where.createdAt[Op.lte] = endOfDay
    }
    return where
}

module.exports = { applyCreatedAtRange }
