const { customLog } = require('../utils/loggerHelper')
const { KYC_STATUS } = require('../constants/kyc')
const { NOTIFICATION_CONTROL, withDefaults } = require('../constants/corporateSettings')
const {
    BALANCE_REMINDER_TTL_SECONDS,
    TOPUP_GUIDE_TTL_SECONDS,
    CORPORATE_SWEEP_BATCH,
    DIGEST_PERIOD_DAYS,
    DIGEST_TTL_SECONDS,
    KYC_SWEEP_BATCH,
    NUDGE_TTL_SECONDS,
    PENDING_KYC_HOURS,
    balanceReminderKey,
    topupGuideKey,
    pendingKycNudgeKey,
    periodKeyFor,
    weeklyDigestKey,
} = require('../constants/notificationJobs')
const { client } = require('../utils/cacheDataMethods')
const { findStalePending } = require('../models/use-cases/cardholderKyc')
const { getAuthorizedSpendSummary } = require('../models/use-cases/cardTransaction')
const {
    findAllApplicationCorporateIds,
    findByCorporate,
} = require('../models/use-cases/corporateCardAdminApplication')
const { findByCorporate: findAgreementByCorporate } = require('../models/use-cases/corporateCardAgreement')
const { getCorporatesByIds, getCardUsersByIds } = require('../utils/sharedDirectory')
const emailer = require('../utils/emailer')
const {
    pendingKycNoticeTemplate,
    walletBalanceReminderTemplate,
    weeklySpendDigestTemplate,
} = require('../utils/notificationJobEmails')
const { walletBalanceParts } = require('./walletBalance')
const { KYB_STATUS } = require('../constants/corporateCardApplication')
const { walletTopupHowToTemplate } = require('../utils/supportEmailTemplates')

const PENDING_STATUSES = [KYC_STATUS.INITIATED, KYC_STATUS.PENDING]

const claimOnce = async (key, ttlSeconds, logTraceId) => {
    try {
        const result = await client.set(key, '1', { NX: true, EX: ttlSeconds })
        return result === 'OK'
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: '[NotificationJobs] Could not claim a send key — skipping to avoid duplicate email',
            key,
            error: error?.message,
        }, 'CONSOLE')
        return false
    }
}

const releaseClaim = async (key) => {
    try {
        await client.del(key)
    } catch (error) {
        // an unreleased claim only delays a retry until the TTL expires
    }
}

const resolveCardholderNames = async (rows, req, logTraceId) => {
    const ids = [...new Set(rows.map((row) => row.userId).filter((id) => id !== null && id !== undefined))]
    if (!ids.length) return new Map()
    try {
        const resolved = await getCardUsersByIds(ids, req)
        return resolved instanceof Map ? resolved : new Map()
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: '[NotificationJobs] Cardholder name lookup failed — sending the notice with mobile numbers only',
            error: error?.message,
        }, 'CONSOLE')
        return new Map()
    }
}

const controlEnabled = async (corporateId, controlKey) => {
    const application = await findByCorporate(corporateId)
    if (!application) return false
    return withDefaults(application.notificationControls)[controlKey] === true
}

const sweepPendingKycNotices = async ({ req, logTraceId, hours = PENDING_KYC_HOURS } = {}) => {
    const olderThan = new Date(Date.now() - hours * 60 * 60 * 1000)
    const rows = await findStalePending({
        olderThan,
        statuses: PENDING_STATUSES,
        limit: KYC_SWEEP_BATCH,
    })

    const counters = { stale: rows.length, corporates: 0, emailed: 0, skippedDisabled: 0, alreadySent: 0, failed: 0 }
    if (!rows.length) return counters

    const byCorporate = new Map()
    rows.forEach((row) => {
        const key = String(row.corporateId)
        if (!byCorporate.has(key)) byCorporate.set(key, [])
        byCorporate.get(key).push(row)
    })
    counters.corporates = byCorporate.size

    const corporates = await getCorporatesByIds([...byCorporate.keys()], req)

    for (const [corporateId, pending] of byCorporate.entries()) {
        if (!await controlEnabled(Number(corporateId), NOTIFICATION_CONTROL.NOTIFY_PENDING_KYC)) {
            counters.skippedDisabled += pending.length
            continue
        }

        const unsent = []
        for (const row of pending) {
            if (await claimOnce(pendingKycNudgeKey(row.id), NUDGE_TTL_SECONDS, logTraceId)) unsent.push(row)
            else counters.alreadySent += 1
        }
        if (!unsent.length) continue

        const corporate = corporates.get(String(corporateId))
        const to = corporate?.email
        if (!to) {
            customLog(logTraceId, 'error', {
                message: '[NotificationJobs] No corporate email — cannot send the pending-KYC notice',
                corporateId,
            }, 'CONSOLE')
            counters.failed += 1
            await Promise.all(unsent.map((row) => releaseClaim(pendingKycNudgeKey(row.id))))
            continue
        }

        const cardholders = await resolveCardholderNames(unsent, req, logTraceId)

        try {
            emailer.email(
                logTraceId,
                to,
                `Action needed: KYC pending for ${unsent.length} cardholder${unsent.length === 1 ? '' : 's'}`,
                pendingKycNoticeTemplate({
                    companyName: corporate.companyName,
                    hours,
                    people: unsent.map((row) => ({
                        name: cardholders.get(String(row.userId))?.name || null,
                        mobileNumber: row.mobileNumber,
                        createdAt: row.createdAt,
                    })),
                })
            )
            counters.emailed += 1
        } catch (error) {
            counters.failed += 1
            customLog(logTraceId, 'error', {
                message: '[NotificationJobs] Pending-KYC notice failed to send',
                corporateId,
                error: error?.message,
            }, 'CONSOLE')
            await Promise.all(unsent.map((row) => releaseClaim(pendingKycNudgeKey(row.id))))
        }
    }

    customLog(logTraceId, 'info', { message: '[NotificationJobs] Pending-KYC sweep', ...counters }, 'CONSOLE')
    return counters
}

const sweepWeeklySpendDigests = async ({ req, logTraceId, days = DIGEST_PERIOD_DAYS } = {}) => {
    const to = new Date()
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
    const periodKey = periodKeyFor(from)

    const corporateIds = (await findAllApplicationCorporateIds()).slice(0, CORPORATE_SWEEP_BATCH)
    const counters = { corporates: corporateIds.length, emailed: 0, skippedDisabled: 0, skippedNoSpend: 0, alreadySent: 0, failed: 0 }
    if (!corporateIds.length) return counters

    const corporates = await getCorporatesByIds(corporateIds, req)

    for (const corporateId of corporateIds) {
        if (!await controlEnabled(Number(corporateId), NOTIFICATION_CONTROL.WEEKLY_SPEND_DIGEST)) {
            counters.skippedDisabled += 1
            continue
        }

        const { total, count: transactions } = await getAuthorizedSpendSummary({
            corporateId: Number(corporateId),
            from,
            to,
        })
        if (!transactions) {
            counters.skippedNoSpend += 1
            continue
        }

        const claim = weeklyDigestKey(corporateId, periodKey)
        if (!await claimOnce(claim, DIGEST_TTL_SECONDS, logTraceId)) {
            counters.alreadySent += 1
            continue
        }

        const corporate = corporates.get(String(corporateId))
        const to_ = corporate?.email
        if (!to_) {
            counters.failed += 1
            await releaseClaim(claim)
            continue
        }

        try {
            emailer.email(
                logTraceId,
                to_,
                'Your weekly Corporate Cards spend digest',
                weeklySpendDigestTemplate({
                    companyName: corporate.companyName,
                    total,
                    transactions,
                    from: from.toISOString().slice(0, 10),
                    to: to.toISOString().slice(0, 10),
                })
            )
            counters.emailed += 1
        } catch (error) {
            counters.failed += 1
            customLog(logTraceId, 'error', {
                message: '[NotificationJobs] Weekly digest failed to send',
                corporateId,
                error: error?.message,
            }, 'CONSOLE')
            await releaseClaim(claim)
        }
    }

    customLog(logTraceId, 'info', { message: '[NotificationJobs] Weekly digest sweep', ...counters }, 'CONSOLE')
    return counters
}

const sweepDailyBalanceReminders = async ({ req, logTraceId } = {}) => {
    const periodKey = periodKeyFor(new Date())

    const corporateIds = (await findAllApplicationCorporateIds()).slice(0, CORPORATE_SWEEP_BATCH)
    const counters = { corporates: corporateIds.length, emailed: 0, skippedDisabled: 0, skippedUnusedWallet: 0, alreadySent: 0, failed: 0 }
    if (!corporateIds.length) return counters

    // The scheduler trigger has no user session, so the directory may be unreachable — agreement emails are the fallback.
    let corporates = new Map()
    try {
        corporates = await getCorporatesByIds(corporateIds, req)
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: '[NotificationJobs] Corporate directory unavailable — using agreement emails for the balance reminders',
            error: error?.message,
            corporateIds,
        }, 'CONSOLE')
    }

    for (const corporateId of corporateIds) {
        if (!await controlEnabled(Number(corporateId), NOTIFICATION_CONTROL.DAILY_BALANCE_REMINDER)) {
            counters.skippedDisabled += 1
            continue
        }

        // Never-funded wallets are skipped — no daily ₹0.00 mails.
        const { ledger, spendTotal, balance } = await walletBalanceParts({ corporateId: Number(corporateId) })
        if (!ledger.in && !ledger.out && !spendTotal) {
            counters.skippedUnusedWallet += 1
            continue
        }

        const claim = balanceReminderKey(corporateId, periodKey)
        if (!await claimOnce(claim, BALANCE_REMINDER_TTL_SECONDS, logTraceId)) {
            counters.alreadySent += 1
            continue
        }

        const corporate = corporates.get(String(corporateId))
        let to = corporate?.email
        let companyName = corporate?.companyName
        if (!to) {
            const agreement = await findAgreementByCorporate(Number(corporateId))
            to = agreement?.regEmail || agreement?.officialContactEmail || null
            companyName = companyName || agreement?.entityName || null
        }
        if (!to) {
            counters.failed += 1
            await releaseClaim(claim)
            continue
        }

        try {
            emailer.email(
                logTraceId,
                to,
                'Your Corporate Cards wallet balance',
                walletBalanceReminderTemplate({
                    companyName,
                    balance,
                    asOf: periodKey,
                })
            )
            counters.emailed += 1
        } catch (error) {
            counters.failed += 1
            customLog(logTraceId, 'error', {
                message: '[NotificationJobs] Wallet balance reminder failed to send',
                corporateId,
                error: error?.message,
            }, 'CONSOLE')
            await releaseClaim(claim)
        }
    }

    customLog(logTraceId, 'info', { message: '[NotificationJobs] Wallet balance reminder sweep', ...counters }, 'CONSOLE')
    return counters
}

const FUNDABLE_STATUSES = [KYB_STATUS.VERIFIED, KYB_STATUS.COMPLETED]

/**
 * Tells an approved corporate how to fund a wallet it has never funded.
 *
 * Deliberately the population sweepDailyBalanceReminders skips: that job ignores never-funded wallets
 * so nobody gets a daily zero-balance mail, which leaves a corporate that was approved and then never
 * worked out how to move money in hearing nothing at all. This is that gap, once a month at most.
 *
 * Stops on its own — the first top-up writes a ledger credit and the corporate drops out of the set.
 */
const sweepWalletTopupGuides = async ({ req, logTraceId } = {}) => {
    const corporateIds = (await findAllApplicationCorporateIds()).slice(0, CORPORATE_SWEEP_BATCH)
    const counters = { corporates: corporateIds.length, emailed: 0, skippedDisabled: 0, skippedNotApproved: 0, skippedFunded: 0, alreadySent: 0, failed: 0 }
    if (!corporateIds.length) return counters

    // The scheduler trigger has no user session, so the directory may be unreachable — agreement emails are the fallback.
    let corporates = new Map()
    try {
        corporates = await getCorporatesByIds(corporateIds, req)
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: '[NotificationJobs] Corporate directory unavailable — using agreement emails for the top-up guides',
            error: error?.message,
        }, 'CONSOLE')
    }

    for (const corporateId of corporateIds) {
        const application = await findByCorporate(Number(corporateId))
        if (!application || !FUNDABLE_STATUSES.includes(application.kybStatus)) {
            counters.skippedNotApproved += 1
            continue
        }
        if (withDefaults(application.notificationControls)[NOTIFICATION_CONTROL.WALLET_TOPUP_GUIDE] !== true) {
            counters.skippedDisabled += 1
            continue
        }

        // A single credit ever is enough to know they have worked it out.
        const { ledger } = await walletBalanceParts({ corporateId: Number(corporateId) })
        if (ledger.in) {
            counters.skippedFunded += 1
            continue
        }

        const claim = topupGuideKey(corporateId)
        if (!await claimOnce(claim, TOPUP_GUIDE_TTL_SECONDS, logTraceId)) {
            counters.alreadySent += 1
            continue
        }

        const corporate = corporates.get(String(corporateId))
        let to = corporate?.email
        let customerName = corporate?.contactPersonName || corporate?.companyName
        if (!to) {
            const agreement = await findAgreementByCorporate(Number(corporateId))
            to = String(agreement?.regEmail || agreement?.officialContactEmail || '').trim() || null
            customerName = customerName || agreement?.entityName
        }
        if (!to) {
            customLog(logTraceId, 'error', {
                message: '[NotificationJobs] No corporate email — cannot send the top-up guide',
                corporateId,
            }, 'CONSOLE')
            counters.failed += 1
            await releaseClaim(claim)
            continue
        }

        try {
            const { subject, html } = walletTopupHowToTemplate({ customerName })
            emailer.email(logTraceId, to, subject, html)
            counters.emailed += 1
        } catch (error) {
            counters.failed += 1
            customLog(logTraceId, 'error', {
                message: '[NotificationJobs] Top-up guide failed to send',
                corporateId,
                error: error?.message,
            }, 'CONSOLE')
            await releaseClaim(claim)
        }
    }

    customLog(logTraceId, 'info', { message: '[NotificationJobs] Wallet top-up guide sweep', ...counters }, 'CONSOLE')
    return counters
}

module.exports = { sweepPendingKycNotices, sweepWeeklySpendDigests, sweepDailyBalanceReminders, sweepWalletTopupGuides }
