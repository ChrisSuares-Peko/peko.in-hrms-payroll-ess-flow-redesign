'use strict'

const NOTIFICATION_CONTROL = {
    REQUIRE_RECEIPTS: 'requireReceipts',
    AUTO_DECLINE_OVER_LIMIT: 'autoDeclineOverLimit',
    NOTIFY_PENDING_KYC: 'notifyPendingKyc',
    WEEKLY_SPEND_DIGEST: 'weeklySpendDigest',
    DAILY_BALANCE_REMINDER: 'dailyBalanceReminder',
    WALLET_TOPUP_GUIDE: 'walletTopupGuide',
}

const NOTIFICATION_CONTROL_KEYS = Object.values(NOTIFICATION_CONTROL)

const NOTIFICATION_CONTROL_DEFAULTS = {
    [NOTIFICATION_CONTROL.REQUIRE_RECEIPTS]: true,
    [NOTIFICATION_CONTROL.AUTO_DECLINE_OVER_LIMIT]: true,
    [NOTIFICATION_CONTROL.NOTIFY_PENDING_KYC]: true,
    [NOTIFICATION_CONTROL.WEEKLY_SPEND_DIGEST]: true,
    [NOTIFICATION_CONTROL.DAILY_BALANCE_REMINDER]: true,
    [NOTIFICATION_CONTROL.WALLET_TOPUP_GUIDE]: true,
}

const withDefaults = (stored) => {
    const source = stored && typeof stored === 'object' ? stored : {}
    return NOTIFICATION_CONTROL_KEYS.reduce((out, key) => ({
        ...out,
        [key]: typeof source[key] === 'boolean' ? source[key] : NOTIFICATION_CONTROL_DEFAULTS[key],
    }), {})
}

const pickControls = (body) => {
    const source = body && typeof body === 'object' ? body : {}
    const unknown = Object.keys(source).filter((key) => !NOTIFICATION_CONTROL_KEYS.includes(key))
    if (unknown.length) return { error: `Unknown setting: ${unknown.join(', ')}.` }

    const provided = NOTIFICATION_CONTROL_KEYS.filter((key) => source[key] !== undefined)
    if (!provided.length) return { error: 'No settings were supplied.' }

    const invalid = provided.filter((key) => typeof source[key] !== 'boolean')
    if (invalid.length) return { error: `These settings must be true or false: ${invalid.join(', ')}.` }

    return { controls: provided.reduce((out, key) => ({ ...out, [key]: source[key] }), {}) }
}

module.exports = {
    NOTIFICATION_CONTROL,
    NOTIFICATION_CONTROL_KEYS,
    NOTIFICATION_CONTROL_DEFAULTS,
    withDefaults,
    pickControls,
}
