// The dispatch webhook's timestamps carry no timezone ("2026-08-08T18:11:10"). The printer and the
// courier are Indian, so the wall-clock is IST; parsed as UTC it would read 5.5 hours early.
const IST_OFFSET = '+05:30'

// Longest dispatch history a single card keeps. A physical card is posted once, twice if re-sent, so a
// row growing past this means the vendor is repeating itself with varying keys — worth a log, not
// worth an unbounded column.
const MAX_DISPATCHES_PER_CARD = 25

const trimmed = (value) => (value === null || value === undefined ? '' : String(value).trim())

/**
 * The courier's timestamp as an unambiguous instant, or null when unparseable.
 *
 * A value already carrying a zone (trailing Z or ±hh:mm) is honoured as sent; a bare local one is read
 * as IST. Stored ALONGSIDE the vendor's own string rather than replacing it, so nothing the issuer sent
 * is lost if this reading ever turns out to be wrong.
 */
const dispatchedAtUtc = (raw) => {
    const value = trimmed(raw)
    if (!value) return null
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
    const parsed = new Date(hasZone ? value : `${value}${IST_OFFSET}`)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/**
 * Identity of a dispatch within one card's history.
 *
 * NOT the AWB alone: the sample payload posts two cards under the same awbNumber, so a card-scoped key
 * has to combine the consignment with when it left and who carried it. referenceNumber is deliberately
 * absent — every record on a card already shares it.
 */
const dispatchKey = (record) => [
    trimmed(record?.awbNumber).toUpperCase(),
    trimmed(record?.dispatchedOn),
    trimmed(record?.courierPartnerID),
].join('|')

/** A dispatch record is usable only if it names the card it belongs to. */
const referenceOf = (record) => {
    const raw = record?.referenceNumber
    if (raw === null || raw === undefined || raw === '') return null
    const value = trimmed(raw)
    return /^\d+$/.test(value) ? value : null
}

/**
 * The vendor record as it will be stored: verbatim, plus the two fields needed to read it later —
 * a zone-qualified instant and when we received it.
 */
const toStoredDispatch = (record, receivedAt = new Date()) => ({
    ...record,
    dispatchedAtUtc: dispatchedAtUtc(record?.dispatchedOn),
    receivedAt: receivedAt.toISOString(),
})

/** Accept the documented root-level array, and a bare object, without guessing at anything else. */
const asRecordArray = (body) => {
    if (Array.isArray(body)) return body
    if (body && typeof body === 'object' && !Array.isArray(body)) {
        if (Array.isArray(body.data)) return body.data
        return Object.keys(body).length ? [body] : []
    }
    return []
}

/** Group records by the card reference they name, preserving arrival order within each group. */
const groupByReference = (records) => {
    const groups = new Map()
    const invalid = []
    for (const record of records) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
            invalid.push(record)
            continue
        }
        const reference = referenceOf(record)
        if (!reference) {
            invalid.push(record)
            continue
        }
        if (!groups.has(reference)) groups.set(reference, [])
        groups.get(reference).push(record)
    }
    return { groups, invalid }
}

module.exports = {
    MAX_DISPATCHES_PER_CARD,
    dispatchedAtUtc,
    dispatchKey,
    referenceOf,
    toStoredDispatch,
    asRecordArray,
    groupByReference,
}
