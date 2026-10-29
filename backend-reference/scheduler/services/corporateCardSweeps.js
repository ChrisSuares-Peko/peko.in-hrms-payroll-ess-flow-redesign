const axios = require('axios');
const { customLog } = require('../utils/loggerHelper');

const SWEEP_TIMEOUT_MS = 120000;

// Calls corporateCard's cron webhook via the api-gateway, authenticated by a shared secret header.
const runDailyBalanceReminderSweep = async () => {
    const baseUrl = (process.env.API_GATEWAY_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const secret = (process.env.CORPORATECARD_CRON_SECRET || '').trim();
    if (!secret) {
        customLog(null, 'error', {
            message: 'scheduler service - corporate cards balance reminder sweep: CORPORATECARD_CRON_SECRET is not configured, skipping',
        });
        return;
    }

    try {
        const { data } = await axios({
            method: 'post',
            url: `${baseUrl}/api/v1/webhook/scheduler/corporate-cards/cron/daily-balance-reminder-sweep`,
            headers: { 'x-cron-callback-secret': secret },
            timeout: SWEEP_TIMEOUT_MS,
        });
        customLog(null, 'info', {
            message: 'scheduler service - corporate cards balance reminder sweep completed',
            counters: data?.data || null,
        });
    } catch (error) {
        customLog(null, 'error', {
            message: 'scheduler service - corporate cards balance reminder sweep failed',
            error: error?.response?.data || error?.message,
        });
    }
};

// Closes in-app card payments whose redeem never got its answer recorded; corporateCard reverses them.
const runInAppPaymentSweep = async () => {
    const baseUrl = (process.env.API_GATEWAY_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const secret = (process.env.CORPORATECARD_CRON_SECRET || '').trim();
    if (!secret) {
        customLog(null, 'error', {
            message: 'scheduler service - corporate cards in-app payment sweep: CORPORATECARD_CRON_SECRET is not configured, skipping',
        });
        return;
    }

    try {
        const { data } = await axios({
            method: 'post',
            url: `${baseUrl}/api/v1/webhook/scheduler/corporate-cards/cron/in-app-payment-sweep`,
            headers: { 'x-cron-callback-secret': secret },
            timeout: SWEEP_TIMEOUT_MS,
        });
        const counters = data?.data || null;
        if (counters?.scanned) {
            customLog(null, 'info', { message: 'scheduler service - corporate cards in-app payment sweep completed', counters });
        }
    } catch (error) {
        customLog(null, 'error', {
            message: 'scheduler service - corporate cards in-app payment sweep failed',
            error: error?.response?.data || error?.message,
        });
    }
};

module.exports = { runDailyBalanceReminderSweep, runInAppPaymentSweep };
