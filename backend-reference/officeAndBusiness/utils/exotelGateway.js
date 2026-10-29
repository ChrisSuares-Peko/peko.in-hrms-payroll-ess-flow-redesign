'use strict';

const querystring = require('querystring');

const axios = require('axios');

const { customLog } = require('./loggerHelper');

// Exotel Voice client — "Connect Two Numbers" (call masking). Bridges the
// customer and the RM through our ExoPhone (CallerId) so the RM's real number is
// never exposed. Auth is HTTP Basic (API Key : API Token). Config from env:
//   EXOTEL_SUBDOMAIN   e.g. api.in.exotel.com (India) | api.exotel.com (Singapore)
//   EXOTEL_ACCOUNT_SID
//   EXOTEL_API_KEY     (Basic auth username)
//   EXOTEL_API_TOKEN   (Basic auth password)
//   EXOTEL_CALLER_ID   the ExoPhone shown to both parties (E.164)

const REQUEST_TIMEOUT_MS = 30000;

const config = () => ({
    subdomain: process.env.EXOTEL_SUBDOMAIN || 'api.in.exotel.com',
    accountSid: process.env.EXOTEL_ACCOUNT_SID,
    apiKey: process.env.EXOTEL_API_KEY,
    apiToken: process.env.EXOTEL_API_TOKEN,
    callerId: process.env.EXOTEL_CALLER_ID,
});

exports.isConfigured = () => {
    const cfg = config();
    return Boolean(cfg.accountSid && cfg.apiKey && cfg.apiToken && cfg.callerId);
};

// Dials `from` first; once answered, bridges `to`. Both see the ExoPhone.
// Returns the Exotel Call object (Sid, Status, ...).
exports.connectCall = async ({ from, to, callType = 'trans', timeLimit }) => {
    const cfg = config();
    if (!cfg.accountSid || !cfg.apiKey || !cfg.apiToken || !cfg.callerId) {
        throw new Error('Exotel configuration missing');
    }
    const url = `https://${cfg.subdomain}/v1/Accounts/${cfg.accountSid}/Calls/connect.json`;
    const body = querystring.stringify({
        From: from,
        To: to,
        CallerId: cfg.callerId,
        CallType: callType,
        ...(timeLimit ? { TimeLimit: String(timeLimit) } : {}),
    });
    // TEMP debug: log the exact values used so a wrong env/number can be spotted.
    // Secrets shown only as lengths — the raw key/token are never logged.
    customLog(null, 'info', {
        message: '[exotel] connect request',
        url,
        from,
        to,
        callerId: cfg.callerId,
        subdomain: cfg.subdomain,
        accountSid: cfg.accountSid,
        apiKeyLen: cfg.apiKey ? cfg.apiKey.length : 0,
        apiTokenLen: cfg.apiToken ? cfg.apiToken.length : 0,
    });
    const res = await axios.post(url, body, {
        auth: { username: cfg.apiKey, password: cfg.apiToken },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: REQUEST_TIMEOUT_MS,
    });
    return res.data?.Call || res.data;
};
