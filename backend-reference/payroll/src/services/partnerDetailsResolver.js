'use strict';
const axios = require('axios');
const { customLog } = require('../utils/loggerHelper');
const { DEFAULT_BRANDING } = require('../utils/email/sharedLayout');

const RESOLVE_TIMEOUT_MS = 2000;

const serverBaseUrl = () =>
  process.env.NODE_ENV === 'staging' ? process.env.STAGING_URL : process.env.SERVER_URL;

// Same header-passthrough convention as emailTemplateResolver.js - no req (e.g. a
// cron job) means no headers, so officeAndBusiness rejects and this falls back to
// Peko's own default branding.
const forwardHeaders = (headers = {}) => ({
  Authorization: headers.authorization,
  sessionid: headers.sessionid,
  // SSO (partner) logins store their session under sessionuuid — without it the gateway rejects the call
  sessionuuid: headers.sessionuuid,
  userdata: headers.userdata,
});

/**
 * Resolve the white-label partner's branding (logo/website/brand name) over HTTP,
 * matching the `fetchPartnerDetails(registeredBy)` convention every other
 * (MySQL-backed) service uses. Mongo-backed payroll can't query the systemUsers
 * table directly, so it proxies through officeAndBusiness's
 * /email-templates/partner-details endpoint instead, falling back to Peko's own
 * default branding on any failure.
 *
 * @returns {Promise<{logo: string, website: string, branding: string}>}
 */
exports.fetchPartnerBranding = async (req) => {
  const logTraceId = req?.LogTraceId;
  // The gateway (F-GW-01) rejects a path id that isn't one of the session's own ids, so 'na'
  // gets a 403. payroll's req.user is the CorporateUser doc (corporate id in _id); routers
  // without mergeParams don't expose :corporateId. ESS sessions carry an employee id in _id,
  // so they use the session's own credential id instead.
  const corporateId = req?.params?.corporateId
    || req?.user?.corporateId
    || (req?.user?.role === 'USER' ? req?.user?.credentialId : req?.user?._id)
    || 'na';
  const credentialId = req?.user?.registeredBy || null;

  // TEMP DIAGNOSTIC — remove once the partner-branding resolution issue is confirmed/fixed.
  customLog(logTraceId, 'info', {
    message: 'fetchPartnerBranding: diagnostic',
    credentialId,
    credentialIdType: typeof credentialId,
    registeredByOnReqUser: req?.user?.registeredBy,
    hasXUserKey: Boolean(req?.headers?.['x-user-key']),
    hasUserdata: Boolean(req?.headers?.userdata),
    hasSessionid: Boolean(req?.headers?.sessionid),
    hasSessionuuid: Boolean(req?.headers?.sessionuuid),
    hasAuthorization: Boolean(req?.headers?.authorization),
  });

  try {
    const url = `${serverBaseUrl()}/api/v1/corporate/${corporateId}/officeAndBusiness/email-templates/partner-details`;
    // TEMP DIAGNOSTIC — remove once confirmed/fixed.
    customLog(logTraceId, 'info', { message: 'fetchPartnerBranding: calling resolver', url, nodeEnv: process.env.NODE_ENV });
    const response = await axios.post(url, { credentialId }, {
      headers: forwardHeaders(req?.headers),
      timeout: RESOLVE_TIMEOUT_MS,
    });

    const resolved = response?.data?.data;
    if (!resolved || typeof resolved.branding !== 'string') {
      throw new Error('Malformed response from partner details resolver');
    }

    // TEMP DIAGNOSTIC — remove once confirmed/fixed.
    customLog(logTraceId, 'info', {
      message: 'fetchPartnerBranding: resolved successfully',
      branding: resolved.branding,
      baseUrl: resolved.baseUrl,
    });

    return {
      logo: resolved.logo || DEFAULT_BRANDING.logo,
      website: resolved.baseUrl || DEFAULT_BRANDING.baseUrl,
      branding: resolved.branding || DEFAULT_BRANDING.branding,
    };
  } catch (error) {
    customLog(logTraceId, 'error', {
      message: 'Partner branding resolve failed, using default branding',
      error: error?.message,
      // TEMP DIAGNOSTIC fields — remove once confirmed/fixed.
      httpStatus: error?.response?.status,
      responseBody: error?.response?.data,
    });
    return { logo: DEFAULT_BRANDING.logo, website: DEFAULT_BRANDING.baseUrl, branding: DEFAULT_BRANDING.branding };
  }
};
