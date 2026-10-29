const { customLog } = require('../utils/loggerHelper')
const { email } = require('../utils/emailer')
const { findByCorporate: findAgreement } = require('../models/use-cases/corporateCardAgreement')
const { walletTopupSuccessTemplate } = require('../utils/walletTopupEmailTemplate')
const { round2 } = require('../utils/cardHelpers')

const LOG_PREFIX = '[WalletTopupEmail]'

// The webhook carries no user session, so the corporate directory is out of reach here; the
// agreement row is the service-local source of the corporate's email address.
const resolveRecipient = (agreement) => {
    const to = String(agreement?.regEmail || agreement?.officialContactEmail || '').trim()
    return to.includes('@') ? to : null
}

const sendWalletTopupSuccessEmails = async ({ creditsByCorporate, logTraceId }) => {
    for (const { corporateId, credits } of creditsByCorporate.values()) {
        try {
            const agreement = await findAgreement(corporateId)
            const to = resolveRecipient(agreement)
            if (!to) {
                // TEMP 30577: VENDOR level so the skip is visible in the log dashboard.
                customLog(logTraceId, 'error', {
                    message: `${LOG_PREFIX} no email on the agreement — top-up mail skipped`,
                    corporateId,
                    agreementFound: !!agreement,
                    hasRegEmail: !!agreement?.regEmail,
                    hasOfficialContactEmail: !!agreement?.officialContactEmail,
                }, 'VENDOR')
                continue
            }

            const totalAmount = round2(credits.reduce((sum, credit) => sum + credit.amount, 0))
            // TEMP 30577: VENDOR-level dispatch + SMTP outcome logs for staging debugging.
            customLog(logTraceId, 'info', {
                message: `${LOG_PREFIX} dispatching top-up mail`,
                corporateId,
                to,
                totalAmount,
            }, 'VENDOR')
            email(
                logTraceId,
                to,
                'Your Peko wallet top-up was successful',
                walletTopupSuccessTemplate({ companyName: agreement?.entityName, totalAmount, credits }),
                (result) => {
                    customLog(logTraceId, result?.ok ? 'info' : 'error', {
                        message: `${LOG_PREFIX} top-up mail ${result?.ok ? 'accepted by the mail server' : 'send failed'}`,
                        corporateId,
                        to,
                        error: result?.ok ? undefined : result?.error,
                    }, 'VENDOR')
                }
            )
        } catch (error) {
            customLog(logTraceId, 'error', {
                message: `${LOG_PREFIX} top-up mail could not be prepared`,
                corporateId,
                error: error?.message,
            }, 'VENDOR')
        }
    }
}

module.exports = { sendWalletTopupSuccessEmails }
