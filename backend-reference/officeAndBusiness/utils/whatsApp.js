const axios = require('axios');
const { customLog } = require('./loggerHelper');

// AiSensy is campaign-based rather than template-name based: each approved Meta
// template is wrapped in a campaign, and we address the campaign by name. The
// body variables go in as a positional array ({{1}}, {{2}}, ...) and the button
// variables, where the template has a dynamic URL button, go in separately.
//
// A sibling copy of the OTP-only sender lives in users/utils/whatsApp.js — the
// monorepo duplicates utils per service (sms.js, emailer.js, pusher.js all
// exist in several copies). This one is the generic template sender.
const AISENSY_BASE_URL = process.env.AISENSY_BASE_URL || 'https://backend.api-wa.co/campaign/peko/api/v2';
const REQUEST_TIMEOUT_MS = 10000;

const isConfigured = () => Boolean(process.env.AISENSY_API_KEY);

// AiSensy needs the destination with a country code. Bare 10-digit numbers are
// Indian; anything already carrying a code is passed through.
const toDestination = mobileNo => {
    const digits = String(mobileNo || '').replace(/[^\d+]/g, '');
    if (!digits) return null;
    const bare = digits.replace(/^\+/, '');
    if (!bare) return null;
    return bare.length === 10 ? `+91${bare}` : `+${bare}`;
};

/**
 * Send one approved WhatsApp template through its AiSensy campaign.
 *
 * Never throws: callers are webhook handlers where a WhatsApp failure must not
 * fail the thing the vendor is actually reporting. Every outcome is logged and
 * described in the return value so the caller can decide the HTTP response.
 *
 * @param {object}   params
 * @param {string}   params.mobileNo        destination, with or without country code
 * @param {string}   params.campaignName    AiSensy campaign wrapping the template
 * @param {string[]} [params.templateParams] positional body variables
 * @param {object[]} [params.buttons]        AiSensy button objects, for dynamic URL buttons
 * @param {string}   [params.userName]       contact name shown in the AiSensy inbox
 * @param {string}   [params.traceId]        request LogTraceId, for correlated logs
 * @returns {Promise<{ sent: boolean, skipped: boolean, reason?: string, error?: string, response?: object }>}
 */
const sendWhatsAppTemplate = async ({ mobileNo, campaignName, templateParams = [], buttons = [], userName, traceId } = {}) => {
    if (!isConfigured()) {
        return { sent: false, skipped: true, reason: 'AISENSY_API_KEY is not set' };
    }
    if (!campaignName) {
        return { sent: false, skipped: true, reason: 'No AiSensy campaign is configured for this template' };
    }

    const destination = toDestination(mobileNo);
    if (!destination) {
        return { sent: false, skipped: true, reason: 'No usable destination mobile number' };
    }

    // Same guard as sms.js / users/utils/whatsApp.js: never message real
    // customers from a non-production deployment.
    if (process.env.NODE_ENV !== 'production') {
        customLog(traceId, 'info', {
            message: 'WhatsApp template send skipped outside production',
            campaignName,
            destination,
            templateParams,
        }, 'VENDOR');
        return { sent: false, skipped: true, reason: 'WhatsApp sending is disabled outside production' };
    }

    try {
        const payload = {
            apiKey: process.env.AISENSY_API_KEY,
            campaignName,
            destination,
            userName: userName || 'Peko',
            source: 'API_Trigger',
            templateParams: templateParams.map(value => String(value)),
        };
        if (buttons.length) payload.buttons = buttons;

        const response = await axios.post(AISENSY_BASE_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: REQUEST_TIMEOUT_MS,
        });

        customLog(traceId, 'info', {
            message: 'WhatsApp template sent',
            campaignName,
            destination,
        }, 'VENDOR');
        return { sent: true, skipped: false, response: response.data };
    } catch (error) {
        customLog(traceId, 'error', {
            message: 'WhatsApp template send failed',
            campaignName,
            destination,
            errorMessage: error.message,
            httpStatus: error.response?.status,
            responseData: error.response?.data,
        }, 'VENDOR');
        return { sent: false, skipped: false, error: error.response?.data?.errorMessage || error.message };
    }
};

module.exports = { sendWhatsAppTemplate, isConfigured, toDestination };
