const { encrypt } = require('./cardCrypto')
const { vendorResponseCode } = require('./cardHelpers')
const { isPinelabsSuccess } = require('./pinelabsGateway')
const { PINELABS_DEFINITIVE_ISSUE_FAILURE_CODES } = require('../constants/pinelabs')
const { ORDER_STATUS, ORDER_VERDICT, ISSUE_OUTCOME } = require('../constants/cardReconcile')

const numberOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

const isPreflightFailure = (result) =>
    result?.ok !== true && (result?.error === 'AUTH_FAILED' || result?.error === 'VENDOR_NOT_CONFIGURED')

const normalizeOrderStatus = (data) => {
    const src = data && typeof data === 'object' ? data : {}
    const records = src.orders ?? src.orderResponseList
    return {
        externalRequestId: src.externalRequestId ?? null,
        orderId: numberOrNull(src.orderId),
        orderStatus: numberOrNull(src.orderStatus),
        totalQuantity: numberOrNull(src.totalQuantity),
        successCount: numberOrNull(src.successCount),
        failedCount: numberOrNull(src.failedCount),
        orderAmount: numberOrNull(src.orderAmount),
        issuanceCharge: numberOrNull(src.issuanceCharge),
        netOrderAmount: numberOrNull(src.netOrderAmount),
        responseCode: numberOrNull(src.responseCode),
        responseMessage: src.responseMessage ?? null,
        records: Array.isArray(records) ? records : [],
    }
}

const normalizeVendorCard = (source, envelope = {}) => {
    const src = source && typeof source === 'object' ? source : {}
    const env = envelope && typeof envelope === 'object' ? envelope : {}
    return {
        orderId: numberOrNull(src.orderId ?? env.orderId),
        referenceNumber: numberOrNull(src.referenceNumber),
        serialNumber: numberOrNull(src.serialNumber),
        oldReferenceNumber: numberOrNull(src.oldReferenceNumber),
        orderAmount: numberOrNull(src.orderAmount ?? src.amount ?? env.orderAmount),
        issuanceCharge: numberOrNull(src.issuanceCharge ?? env.issuanceCharge),
        netOrderAmount: numberOrNull(src.netOrderAmount ?? env.netOrderAmount),
        maskedCardNumber: src.maskedCardNumber ?? null,
        cardViewLink: src.cardViewLink ?? src.cardLink ?? src.cardView ?? null,
        pinSetLink: src.pinSetLink ?? src.resetPinLink ?? src.pinResetLink ?? src.setPinLink ?? null,
        accountNumber: src.accountNumber ?? null,
        approvalCode: src.approvalCode ?? null,
        externalCardIdentifier: src.externalCardIdentifier ?? null,
        responseCode: numberOrNull(src.responseCode),
        responseMessage: src.responseMessage ?? null,
    }
}

const pickOrderRecord = (order, { externalCardIdentifier, sourceReferenceNumber } = {}) => {
    const records = order?.records || []
    if (!records.length) return { record: null, ambiguous: false }
    if (records.length === 1) return { record: records[0], ambiguous: false }

    if (externalCardIdentifier) {
        const match = records.find((r) => r?.externalCardIdentifier
            && String(r.externalCardIdentifier) === String(externalCardIdentifier))
        if (match) return { record: match, ambiguous: false }
    }
    if (sourceReferenceNumber !== null && sourceReferenceNumber !== undefined) {
        const match = records.find((r) => r?.referenceNumber !== null && r?.referenceNumber !== undefined
            && String(r.referenceNumber) === String(sourceReferenceNumber))
        if (match) return { record: match, ambiguous: false }
    }
    return { record: null, ambiguous: true }
}

const vendorErrorSummary = (vendorCode, message) => {
    const code = Number.isFinite(vendorCode) ? vendorCode : 'none'
    let text = ''
    if (typeof message === 'string') text = message
    else if (message !== null && message !== undefined) {
        try {
            text = JSON.stringify(message)
        } catch (err) {
            text = String(message)
        }
    }
    return `code=${code} msg=${text}`.slice(0, 255)
}

const classifyIssueOutcome = (result) => {
    const vendorCode = vendorResponseCode(result)

    if (isPreflightFailure(result)) {
        return { outcome: ISSUE_OUTCOME.DEFINITIVE_FAILURE, vendorCode: null, reason: String(result.error), alert: true }
    }

    if (isPinelabsSuccess(result)) {
        if (result.data?.referenceNumber === null || result.data?.referenceNumber === undefined) {
            return { outcome: ISSUE_OUTCOME.UNKNOWN, vendorCode, reason: 'RC0_WITHOUT_REFERENCE_NUMBER', alert: true }
        }
        return { outcome: ISSUE_OUTCOME.CONFIRMED, vendorCode, reason: 'RC0', alert: false }
    }

    if (result?.noResponse === true) {
        return { outcome: ISSUE_OUTCOME.UNKNOWN, vendorCode, reason: 'NO_RESPONSE', alert: false }
    }

    if (Number.isFinite(vendorCode) && PINELABS_DEFINITIVE_ISSUE_FAILURE_CODES.includes(vendorCode)) {
        return { outcome: ISSUE_OUTCOME.DEFINITIVE_FAILURE, vendorCode, reason: 'PRE_ORDER_REJECTION', alert: false }
    }

    return { outcome: ISSUE_OUTCOME.UNKNOWN, vendorCode, reason: 'UNRESOLVED_VENDOR_RESPONSE', alert: vendorCode === 319 }
}

const classifyOrderStatus = (result, { externalRequestId, externalCardIdentifier, sourceReferenceNumber } = {}) => {
    const vendorCode = vendorResponseCode(result)
    const ambiguous = (reason, extra = {}) =>
        ({ verdict: ORDER_VERDICT.AMBIGUOUS, order: null, record: null, reason, vendorCode, alert: false, ...extra })

    if (!isPinelabsSuccess(result)) {
        const alert = Number.isFinite(vendorCode) && (vendorCode === 13 || vendorCode === 319)
        return ambiguous('STATUS_CALL_UNSUCCESSFUL', { alert })
    }

    const order = normalizeOrderStatus(result.data)

    if (order.externalRequestId && String(order.externalRequestId) !== String(externalRequestId)) {
        return ambiguous('EXTERNAL_REQUEST_ID_MISMATCH', { order, alert: true })
    }

    if (order.orderStatus === ORDER_STATUS.CREATED) {
        return { verdict: ORDER_VERDICT.PROCESSING, order, record: null, reason: 'ORDER_CREATED', vendorCode, alert: false }
    }
    if (order.orderStatus !== ORDER_STATUS.PROCESSED) {
        return ambiguous('UNEXPECTED_ORDER_STATUS', { order, alert: true })
    }

    if (!order.records.length) return ambiguous('NO_ORDER_RECORDS', { order, alert: true })

    const { record, ambiguous: unmatched } = pickOrderRecord(order, { externalCardIdentifier, sourceReferenceNumber })
    if (unmatched || !record) return ambiguous('NO_MATCHING_ORDER_RECORD', { order, alert: true })

    const mixedCounts = order.successCount >= 1 && order.failedCount >= 1
    if (mixedCounts || (order.totalQuantity !== null && order.totalQuantity > 1)) {
        return ambiguous('UNEXPECTED_ORDER_COMPOSITION', { order, record, alert: true })
    }

    const recordCode = numberOrNull(record.responseCode)
    if (recordCode === 0) {
        if (record.referenceNumber === null || record.referenceNumber === undefined) {
            return ambiguous('RECORD_RC0_WITHOUT_REFERENCE_NUMBER', { order, record, alert: true })
        }
        return { verdict: ORDER_VERDICT.ISSUED, order, record, reason: 'RECORD_RC0', vendorCode, alert: false }
    }

    if (order.failedCount >= 1 && order.successCount === 0) {
        return {
            verdict: ORDER_VERDICT.FAILED,
            order,
            record,
            reason: vendorErrorSummary(recordCode, record.responseMessage),
            vendorCode,
            alert: false,
        }
    }
    return ambiguous('RECORD_FAILED_WITHOUT_CORROBORATING_COUNTS', { order, record, alert: true })
}

const buildIssuedCardFields = (card, raw) => ({
    orderId: card.orderId,
    referenceNumber: card.referenceNumber,
    serialNumber: card.serialNumber,
    orderAmount: card.orderAmount,
    maskedCardNumber: card.maskedCardNumber,
    accountNumber: encrypt(card.accountNumber ?? null),
    cardViewLink: encrypt(card.cardViewLink ?? null),
    ...(card.pinSetLink ? { resetPinLink: encrypt(card.pinSetLink) } : {}),
    rawResponse: encrypt(raw),
    lastEventAt: new Date().toISOString(),
})

module.exports = {
    normalizeOrderStatus,
    normalizeVendorCard,
    pickOrderRecord,
    classifyIssueOutcome,
    classifyOrderStatus,
    buildIssuedCardFields,
    vendorErrorSummary,
    isPreflightFailure,
}
