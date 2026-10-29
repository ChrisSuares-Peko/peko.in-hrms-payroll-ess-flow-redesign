/**
 * The three cardholder mails the Pine Labs BRD makes Peko responsible for on in-app debits: success, failure
 * and refund. Fire-and-forget: a mail problem never changes the payment's outcome.
 */
const { customLog } = require('../utils/loggerHelper')
const { email: sendEmail } = require('../utils/emailer')
const { last4 } = require('../utils/cardHelpers')
const {
    inAppDebitSuccessTemplate,
    inAppDebitFailureTemplate,
    inAppDebitRefundTemplate,
} = require('../utils/inAppPaymentEmailTemplates')

const LOG_PREFIX = '[InAppPaymentEmails]'

const usableAddress = (value) => {
    const to = String(value || '').trim()
    return to.includes('@') ? to : null
}

// The card row carries the holder's email from issuance; there is no session on any of these paths.
const dispatch = ({ card, subject, build, args, stage, logTraceId }) => {
    try {
        const to = usableAddress(card?.email)
        if (!to) {
            customLog(logTraceId, 'info', { message: `${LOG_PREFIX} ${stage}: no cardholder email — mail skipped`, cardIssuanceId: card?.id ?? null }, 'CONSOLE')
            return false
        }
        sendEmail(logTraceId, to, subject, build({ name: card?.nameOnCard, cardLast4: last4(card?.maskedCardNumber), ...args }))
        return true
    } catch (error) {
        customLog(logTraceId, 'error', { message: `${LOG_PREFIX} ${stage}: mail could not be prepared`, cardIssuanceId: card?.id ?? null, error: error?.message }, 'CONSOLE')
        return false
    }
}

const sendInAppDebitSuccess = ({ card, amount, reference, logTraceId }) =>
    dispatch({ card, subject: 'Your corporate card payment was successful', build: inAppDebitSuccessTemplate, args: { amount, reference }, stage: 'success', logTraceId })

const sendInAppDebitFailure = ({ card, amount, reference, reason, logTraceId }) =>
    dispatch({ card, subject: 'Your corporate card payment did not go through', build: inAppDebitFailureTemplate, args: { amount, reference, reason }, stage: 'failure', logTraceId })

const sendInAppDebitRefund = ({ card, amount, reference, logTraceId }) =>
    dispatch({ card, subject: 'Your corporate card payment was refunded', build: inAppDebitRefundTemplate, args: { amount, reference }, stage: 'refund', logTraceId })

module.exports = { sendInAppDebitSuccess, sendInAppDebitFailure, sendInAppDebitRefund }
