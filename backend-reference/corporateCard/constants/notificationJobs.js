'use strict'

const PENDING_KYC_HOURS = 48

const DIGEST_PERIOD_DAYS = 7

const KYC_SWEEP_BATCH = 200

const CORPORATE_SWEEP_BATCH = 200

const NUDGE_TTL_SECONDS = 14 * 24 * 60 * 60

const DIGEST_TTL_SECONDS = 10 * 24 * 60 * 60

const BALANCE_REMINDER_TTL_SECONDS = 2 * 24 * 60 * 60

const TOPUP_GUIDE_TTL_SECONDS = 30 * 24 * 60 * 60

// One decline notice per card, per reason, per day: a blocked merchant tapped five times is one mail.
const DECLINE_NOTICE_TTL_SECONDS = 24 * 60 * 60

const pendingKycNudgeKey = (kycId) => `cc:job:kycnudge:${kycId}`

const weeklyDigestKey = (corporateId, periodKey) => `cc:job:digest:${corporateId}:${periodKey}`

const balanceReminderKey = (corporateId, periodKey) => `cc:job:balreminder:${corporateId}:${periodKey}`

const topupGuideKey = (corporateId) => `cc:job:topupguide:${corporateId}`

const declineNoticeKey = (cardIssuanceId, reason, periodKey) => `cc:job:decline:${cardIssuanceId}:${reason}:${periodKey}`

const periodKeyFor = (date) => {
    const d = new Date(date)
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString().slice(0, 10)
}

module.exports = {
    PENDING_KYC_HOURS,
    DIGEST_PERIOD_DAYS,
    KYC_SWEEP_BATCH,
    CORPORATE_SWEEP_BATCH,
    NUDGE_TTL_SECONDS,
    DIGEST_TTL_SECONDS,
    BALANCE_REMINDER_TTL_SECONDS,
    TOPUP_GUIDE_TTL_SECONDS,
    DECLINE_NOTICE_TTL_SECONDS,
    pendingKycNudgeKey,
    weeklyDigestKey,
    balanceReminderKey,
    topupGuideKey,
    declineNoticeKey,
    periodKeyFor,
}
