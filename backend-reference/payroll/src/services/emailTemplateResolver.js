'use strict';
const axios = require('axios');
const { customLog } = require('../utils/loggerHelper');

const PAYROLL_EMAIL_TEMPLATE_SERVICE = 'PAYROLL';
const RESOLVE_TIMEOUT_MS = 2000;

const serverBaseUrl = () =>
  process.env.NODE_ENV === 'staging' ? process.env.STAGING_URL : process.env.SERVER_URL;

// Forwards the caller's own session so officeAndBusiness's verifyToken can
// authenticate it - no separate service secret. No req (e.g. a cron job) means
// no headers, so officeAndBusiness rejects and this falls back to the local template.
const forwardHeaders = (headers = {}) => ({
  Authorization: headers.authorization,
  sessionid: headers.sessionid,
  // SSO (partner) logins store their session under sessionuuid — without it the gateway rejects the call
  sessionuuid: headers.sessionuuid,
  userdata: headers.userdata,
  'x-user-key': headers['x-user-key'],
});

/**
 * Resolve an admin-managed email template over HTTP, falling back to payroll's
 * local template on any failure. Mongo-backed payroll can't query
 * adminEmailTemplates directly, so it proxies through officeAndBusiness's
 * /email-templates/resolve endpoint instead.
 *
 * @returns {Promise<{subject: string, html: string, source: 'DYNAMIC'|'FALLBACK', reason?: string, sender?: string}>}
 */
exports.resolveDynamicEmail = async ({ req, key, variables = {}, fallbackSubject, fallbackHtml, partnerId = null }) => {
  const logTraceId = req?.LogTraceId;
  // The gateway (F-GW-01) rejects a path id that isn't one of the session's own ids, so 'na'
  // gets a 403. payroll's req.user is the CorporateUser doc (corporate id in _id); routers
  // without mergeParams don't expose :corporateId. ESS sessions carry an employee id in _id,
  // so they use the session's own credential id instead.
  const corporateId = req?.params?.corporateId
    || req?.user?.corporateId
    || (req?.user?.role === 'USER' ? req?.user?.credentialId : req?.user?._id)
    || 'na';

  try {
    const url = `${serverBaseUrl()}/api/v1/corporate/${corporateId}/officeAndBusiness/email-templates/resolve`;
    const response = await axios.post(url, {
      key,
      service: PAYROLL_EMAIL_TEMPLATE_SERVICE,
      variables,
      fallbackSubject,
      fallbackHtml,
      partnerId,
    }, {
      headers: forwardHeaders(req?.headers),
      timeout: RESOLVE_TIMEOUT_MS,
    });

    const resolved = response?.data?.data;
    if (!resolved || typeof resolved.html !== 'string' || typeof resolved.subject !== 'string') {
      throw new Error('Malformed response from email template resolver');
    }

    customLog(logTraceId, 'info', {
      message: `Email template key=${key} resolved via ${resolved.source}`,
      key,
      service: PAYROLL_EMAIL_TEMPLATE_SERVICE,
      source: resolved.source,
      reason: resolved.reason,
    });
    return resolved;
  } catch (error) {
    customLog(logTraceId, 'error', {
      message: `Dynamic email resolve failed for key ${key}, using local fallback`,
      error: error?.message,
    });
    return { subject: fallbackSubject, html: fallbackHtml, source: 'FALLBACK', reason: 'service_unreachable' };
  }
};
