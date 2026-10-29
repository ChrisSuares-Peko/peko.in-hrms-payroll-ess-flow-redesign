const { CARD_STATUS } = require('../constants/card')
const { toNum, last4 } = require('./cardHelpers')

// What the tracking table's Status column reads. Deliberately the ORDER's state, not the courier's:
// the courier leg lives in its own column, and a card can be issued with nothing dispatched yet.
const TRACKING_STATUS = {
    [CARD_STATUS.PENDING]: 'Ordered',
    [CARD_STATUS.ISSUED]: 'Issued',
    [CARD_STATUS.FAILED]: 'Failed',
    [CARD_STATUS.REPLACED]: 'Replaced',
}

const TRACKING_STATUS_FILTERS = { Ordered: CARD_STATUS.PENDING, Issued: CARD_STATUS.ISSUED, Failed: CARD_STATUS.FAILED }

const text = (value) => {
    const trimmed = value === null || value === undefined ? '' : String(value).trim()
    return trimmed || null
}

/**
 * The delivery address as one line, from the shipping details captured when the card was ordered.
 * Skips the parts that were not filled in rather than leaving stray commas behind.
 */
const shippingLine = (shipping) => {
    if (!shipping || typeof shipping !== 'object') return null
    const street = [shipping.addressLine1, shipping.addressLine2].map(text).filter(Boolean).join(', ')
    const locality = [text(shipping.city), text(shipping.state)].filter(Boolean).join(', ')
    const pin = text(shipping.pinCode)
    return [street, locality, pin].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || null
}

/**
 * One courier movement for the Tracking column: who carried it, the consignment number, and when it
 * left from where. `dispatchedAtUtc` is what the UI should format; `dispatchedOn` is kept because it is
 * what the issuer actually sent.
 */
const serializeDispatch = (record) => ({
    awbNumber: text(record?.awbNumber),
    courierPartnerName: text(record?.courierPartnerName),
    courierPartnerId: toNum(record?.courierPartnerID) ?? null,
    dispatchedOn: text(record?.dispatchedOn),
    dispatchedAtUtc: text(record?.dispatchedAtUtc),
    origin: [text(record?.city), text(record?.state), text(record?.pinCode)].filter(Boolean).join(', ') || null,
    receivedAt: text(record?.receivedAt),
})

/**
 * A physical card order as the tracking table needs it.
 *
 * Intentionally NOT serializeCard: that shape is returned to cardholders for their own cards, and a
 * postal address and courier history do not belong in every card payload.
 */
const serializeCardTracking = (row) => {
    const dispatches = Array.isArray(row.dispatches) ? row.dispatches : []
    return {
        key: String(row.id),
        cardIssuanceId: row.id,
        orderedOn: row.createdAt,
        holderId: row.userId ?? null,
        holder: row.cardholder?.name || null,
        department: row.cardholder?.role || null,
        maskedCardNumber: row.maskedCardNumber || null,
        last4: last4(row.maskedCardNumber),
        nameOnCard: row.nameOnCard || null,
        shippingAddress: shippingLine(row.shipping),
        referenceNumber: row.referenceNumber === null || row.referenceNumber === undefined ? null : String(row.referenceNumber),
        status: TRACKING_STATUS[row.status] || row.status,
        dispatches: dispatches.map(serializeDispatch),
        dispatchCount: dispatches.length,
    }
}

module.exports = { serializeCardTracking, serializeDispatch, shippingLine, TRACKING_STATUS, TRACKING_STATUS_FILTERS }
