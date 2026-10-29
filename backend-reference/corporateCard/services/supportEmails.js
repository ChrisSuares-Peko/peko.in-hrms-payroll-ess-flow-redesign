/**
 * Sends the support team's customer-facing Corporate Cards mails.
 *
 * One entry point so every scenario resolves its recipient the same way and, more importantly, fails
 * the same way: a mail that cannot be sent is logged and swallowed. These are courtesy notices sent
 * from the middle of KYB submission and card ordering — a bad mailbox must not fail the thing the
 * customer actually asked for.
 *
 * Sent over utils/emailer, the same mailbox every other customer-facing mail in this service uses.
 * NOT utils/corporateCardEmailer: EMAILER_CORPORATECARD_* is the address Pine Labs corresponds with,
 * and customer mail has no business going out from it — or sharing its fate when it is rate-limited.
 */

const { customLog } = require('../utils/loggerHelper')
const { getCorporatesByIds, getSelfCorporate } = require('../utils/sharedDirectory')
const { client: cache } = require('../utils/cacheDataMethods')
const { DECLINE_REASON } = require('../constants/jit')
const { SUPPORT_EMAIL } = require('../constants/supportEmails')
const { DECLINE_NOTICE_TTL_SECONDS, declineNoticeKey, periodKeyFor } = require('../constants/notificationJobs')
const { transactionDeclinedAdminTemplate, transactionDeclinedEmployeeTemplate } = require('../utils/supportEmailTemplates')
const { email: sendEmail } = require('../utils/emailer')

const LOG_PREFIX = '[SupportEmails]'

/**
 * The corporate record, looked up the way the session allows.
 *
 * /corporates/batch is mounted only under the system_user tree; a corporate or employee session
 * 404s on it. Those sessions can reach /corporates/self instead — and that is all they need, since
 * every corporate-context trigger here is the corporate acting on itself. The id check is belt and
 * braces: a self lookup can never legitimately return somebody else's corporate.
 */
const lookupCorporate = async (corporateId, req) => {
    if (req?.user?.role === 'SYSTEM_USER') {
        const corporates = await getCorporatesByIds([corporateId], req)
        return corporates.get(String(corporateId)) || null
    }
    const self = await getSelfCorporate(req)
    return self && String(self.id) === String(corporateId) ? self : null
}

/** The corporate's mailbox and the name the copy greets, or null when the directory cannot answer. */
const resolveCorporateRecipient = async (corporateId, req) => {
    try {
        const corporate = await lookupCorporate(corporateId, req)
        if (!corporate?.email) return null
        return {
            to: corporate.email,
            customerName: corporate.contactPersonName || corporate.companyName || '',
        }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: `${LOG_PREFIX} corporate lookup failed — skipping the mail`,
            corporateId,
            error: error?.message,
        }, 'CONSOLE')
        return null
    }
}

/**
 * Renders `template` for the corporate and sends it. Never throws.
 *
 * `extras` is merged into the template's arguments, for the scenarios that carry data beyond the
 * customer's name. Returns { sent } so a caller that wants to report it can.
 */
const sendCorporateSupportEmail = async ({ corporateId, template, templateKey, extras = {}, req }) => {
    const recipient = await resolveCorporateRecipient(corporateId, req)
    if (!recipient) {
        customLog(req?.LogTraceId, 'error', {
            message: `${LOG_PREFIX} no corporate email on file — skipping`,
            corporateId,
            templateKey,
        }, 'CONSOLE')
        return { sent: false }
    }

    try {
        const { subject, html } = template({ customerName: recipient.customerName, ...extras })
        sendEmail(req?.LogTraceId, recipient.to, subject, html)
        customLog(req?.LogTraceId, 'info', {
            action: 'corporateCard:supportEmail:queued',
            message: `${LOG_PREFIX} queued`,
            corporateId,
            templateKey,
        }, 'CONSOLE')
        return { sent: true }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: `${LOG_PREFIX} could not build or queue the mail`,
            corporateId,
            templateKey,
            error: error?.message,
        }, 'CONSOLE')
        return { sent: false }
    }
}

/**
 * The same mail, sent from a Pine Labs webhook.
 *
 * A webhook carries no user session, so the corporate directory is unreachable — internalPost needs
 * the caller's authorization and sessionid headers. The agreement row is the service-local stand-in,
 * the same source services/walletTopupEmail.js already uses for the top-up receipt.
 */
const sendCorporateSupportEmailFromWebhook = async ({ corporateId, template, templateKey, extras = {}, logTraceId }) => {
    try {
        // Required late: pulling the agreement entity in at module load drags a sequelize model into
        // every controller that only uses the request-path sender above.
        const { findByCorporate: findAgreement } = require('../models/use-cases/corporateCardAgreement')
        const agreement = await findAgreement(corporateId)
        const to = String(agreement?.regEmail || agreement?.officialContactEmail || '').trim()
        if (!to.includes('@')) {
            customLog(logTraceId, 'error', {
                message: `${LOG_PREFIX} no email on the agreement — skipping`,
                corporateId,
                templateKey,
            }, 'CONSOLE')
            return { sent: false }
        }

        const { subject, html } = template({ customerName: agreement?.entityName || '', ...extras })
        sendEmail(logTraceId, to, subject, html)
        customLog(logTraceId, 'info', {
            action: 'corporateCard:supportEmail:queued',
            message: `${LOG_PREFIX} queued from webhook`,
            corporateId,
            templateKey,
        }, 'CONSOLE')
        return { sent: true }
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: `${LOG_PREFIX} webhook mail could not be prepared`,
            corporateId,
            templateKey,
            error: error?.message,
        }, 'CONSOLE')
        return { sent: false }
    }
}

// The decline mail tells the admin to check the merchant allow-list and the card's spend limit, so
// it only goes out when one of those was the cause. A frozen card, an empty wallet or a network
// block would get advice that does not apply.
const DECLINE_NOTICE_REASONS = new Set([
    DECLINE_REASON.RESTRICTED_MERCHANT_CATEGORY,
    DECLINE_REASON.OVER_PER_TXN_LIMIT,
    DECLINE_REASON.OVER_PERIOD_LIMIT,
])

/**
 * Tells the admin a card was declined for a reason they can fix.
 *
 * Called from the JIT authorisation path WITHOUT await: Pine Labs is waiting on the approve/decline
 * answer, and a mail must never make that slower. Everything in here resolves to a result rather than
 * throwing, so a bare call is safe.
 *
 * Dedupe is per card, per reason, per day. Redis SET NX is the claim; if Redis is down the claim
 * fails closed and nothing is sent — a missed courtesy mail beats a flood.
 */
const notifyAdminOfDecline = async ({ cardIssuance, declineReason, logTraceId }) => {
    if (!cardIssuance?.corporateId || !DECLINE_NOTICE_REASONS.has(declineReason)) return { sent: false, skipped: 'not-applicable' }

    const key = declineNoticeKey(cardIssuance.id, declineReason, periodKeyFor(new Date()))
    let claimed = false
    try {
        claimed = (await cache.set(key, '1', { NX: true, EX: DECLINE_NOTICE_TTL_SECONDS })) === 'OK'
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: `${LOG_PREFIX} could not claim the decline-notice key — skipping to avoid a duplicate`,
            key,
            error: error?.message,
        }, 'CONSOLE')
        return { sent: false, skipped: 'claim-failed' }
    }
    if (!claimed) return { sent: false, skipped: 'already-sent-today' }

    const admin = await sendCorporateSupportEmailFromWebhook({
        corporateId: cardIssuance.corporateId,
        template: transactionDeclinedAdminTemplate,
        templateKey: SUPPORT_EMAIL.TRANSACTION_DECLINED_ADMIN,
        logTraceId,
    })
    await notifyEmployeeOfDecline({ cardIssuance, logTraceId })
    return admin
}

/**
 * The employee's copy, to the address written onto the card at issuance.
 *
 * Shares the admin notice's claim, so one decline is one event however many people hear about it.
 * Skipped when the card carries no email (issued before the column existed, or a directory record
 * without one) and when that address is the admin's own — the admin already has their copy, and a
 * corporate owner's card must not produce two mails for one decline.
 */
const notifyEmployeeOfDecline = async ({ cardIssuance, logTraceId }) => {
    const to = String(cardIssuance?.email || '').trim().toLowerCase()
    if (!to.includes('@')) return { sent: false, skipped: 'no-employee-email' }

    try {
        // Required late for the same reason as the webhook sender above.
        const { findByCorporate: findAgreement } = require('../models/use-cases/corporateCardAgreement')
        const agreement = await findAgreement(cardIssuance.corporateId)
        const adminAddresses = [agreement?.regEmail, agreement?.officialContactEmail]
            .map((value) => String(value || '').trim().toLowerCase())
            .filter(Boolean)
        if (adminAddresses.includes(to)) return { sent: false, skipped: 'is-admin' }

        const { subject, html } = transactionDeclinedEmployeeTemplate({ customerName: cardIssuance.nameOnCard || '' })
        sendEmail(logTraceId, to, subject, html)
        customLog(logTraceId, 'info', {
            action: 'corporateCard:supportEmail:queued',
            message: `${LOG_PREFIX} queued employee decline notice`,
            corporateId: cardIssuance.corporateId,
            cardIssuanceId: cardIssuance.id,
            templateKey: SUPPORT_EMAIL.TRANSACTION_DECLINED_EMPLOYEE,
        }, 'CONSOLE')
        return { sent: true }
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: `${LOG_PREFIX} employee decline notice could not be prepared`,
            corporateId: cardIssuance?.corporateId,
            cardIssuanceId: cardIssuance?.id,
            error: error?.message,
        }, 'CONSOLE')
        return { sent: false, skipped: 'error' }
    }
}

module.exports = { resolveCorporateRecipient, sendCorporateSupportEmail, sendCorporateSupportEmailFromWebhook, notifyAdminOfDecline }
