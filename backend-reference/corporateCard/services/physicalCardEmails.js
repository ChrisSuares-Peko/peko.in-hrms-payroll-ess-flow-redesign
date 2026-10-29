/**
 * Sends the two physical-card lifecycle mails to the cardholder.
 *
 * Every entry point is fire-and-forget from the caller's point of view: a missing address or a
 * transport error is logged and swallowed, because both mails ride on something that matters more —
 * an issuance the corporate is waiting on, or a webhook Pine Labs will retry if it fails.
 *
 * The recipient is the email captured on the card at issuance. Cards issued before that column
 * existed carry none and are skipped with a log line, not a guess at somebody else's address.
 */

const { customLog } = require('../utils/loggerHelper')
const { email: sendEmail } = require('../utils/emailer')
const { shippingLine } = require('../utils/serializeCardTracking')
const { physicalCardConfirmedTemplate, physicalCardDispatchedTemplate } = require('../utils/physicalCardEmailTemplates')

const LOG_PREFIX = '[PhysicalCardEmails]'

/** "Priya Sharma" -> "Priya"; the deck greets by first name only. */
const firstNameOf = (name) => String(name || '').trim().split(/\s+/)[0] || ''

const usableAddress = (value) => {
    const to = String(value || '').trim()
    return to.includes('@') ? to : null
}

const dispatch = ({ to, build, args, stage, logTraceId, context }) => {
    const recipient = usableAddress(to)
    if (!recipient) {
        customLog(logTraceId, 'error', {
            message: `${LOG_PREFIX} no cardholder email on the card — ${stage} mail skipped`,
            ...context,
        }, 'CONSOLE')
        return { sent: false, skipped: 'no-email' }
    }

    try {
        const { subject, html } = build(args)
        sendEmail(logTraceId, recipient, subject, html)
        customLog(logTraceId, 'info', {
            action: `corporateCard:physicalCard:${stage}:emailQueued`,
            message: `${LOG_PREFIX} ${stage} mail queued`,
            ...context,
        }, 'CONSOLE')
        return { sent: true }
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: `${LOG_PREFIX} ${stage} mail could not be prepared`,
            ...context,
            error: error?.message,
        }, 'CONSOLE')
        return { sent: false, skipped: 'error' }
    }
}

/** The issuer confirmed the physical card order. Called from both confirmation paths. */
const sendPhysicalCardConfirmed = ({ to, nameOnCard, shipping, referenceNumber, cardIssuanceId, logTraceId }) =>
    dispatch({
        to,
        build: physicalCardConfirmedTemplate,
        args: {
            firstName: firstNameOf(nameOnCard),
            cardReferenceNumber: referenceNumber != null ? String(referenceNumber) : '',
            deliveryAddress: shippingLine(shipping) || '',
        },
        stage: 'confirmed',
        logTraceId,
        context: { cardIssuanceId, referenceNumber: referenceNumber ?? null },
    })

/** The printer handed the card to the courier. Called from the dispatch webhook on a new dispatch. */
const sendPhysicalCardDispatched = ({ to, nameOnCard, shipping, courierPartner, awbNumber, cardIssuanceId, logTraceId }) =>
    dispatch({
        to,
        build: physicalCardDispatchedTemplate,
        args: {
            firstName: firstNameOf(nameOnCard),
            courierPartner: courierPartner || '',
            awbNumber: awbNumber || '',
            deliveryAddress: shippingLine(shipping) || '',
        },
        stage: 'dispatched',
        logTraceId,
        context: { cardIssuanceId, awbNumber: awbNumber ?? null },
    })

module.exports = { sendPhysicalCardConfirmed, sendPhysicalCardDispatched, firstNameOf }
