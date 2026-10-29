"use strict";
// Every emailed set-password / reset-password link is built from a frontend base URL. The clients send that
// URL in the request, so on its own it is attacker-controlled: a lookalike host would receive the victim's
// live reset token (reset-link poisoning). A requested URL is used only when its origin is one of ours — the
// platform frontends, a partner portal registered on a system user, or an origin listed in
// TRUSTED_FRONTEND_ORIGINS — and otherwise the link falls back to the partner's / platform's own URL.
const systemUser = require("../models/entities/systemUser");
const { fetchPartnerBaseUrl } = require("../models/use-cases/systemUser");
const partnerLogos = require("../public/partnerLogos");
const { customLog } = require("./loggerHelper");

const PARTNER_ORIGINS_TTL_MS = 5 * 60 * 1000;
let partnerOriginsCache = { origins: [], loadedAt: 0 };

const originOf = (url) => {
  try {
    const parsed = new URL(String(url).trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.origin.toLowerCase() : null;
  } catch {
    return null;
  }
};

const withoutTrailingSlash = (url) => String(url || "").trim().replace(/\/+$/, "");

const platformFrontendUrl = () =>
  (process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL) || partnerLogos[0]?.baseUrl;

const staticOrigins = () =>
  [
    process.env.FRONTEND_PRODUCTION_URL,
    process.env.FRONTEND_STAGING_URL,
    process.env.IDP_FRONTEND_URL,
    ...partnerLogos.map((partner) => partner?.baseUrl),
    ...String(process.env.TRUSTED_FRONTEND_ORIGINS || "").split(","),
  ]
    .map(originOf)
    .filter(Boolean);

// Partner portals live on system users (assets.baseUrl / portalUrl); cached so a burst of invites does not
// re-read the table for each one.
const partnerOrigins = async () => {
  if (Date.now() - partnerOriginsCache.loadedAt < PARTNER_ORIGINS_TTL_MS) return partnerOriginsCache.origins;
  try {
    const rows = await systemUser.findAll({ attributes: ["assets", "portalUrl"], raw: true });
    const origins = rows
      .flatMap((row) => {
        let assets = row.assets;
        if (typeof assets === "string") {
          try { assets = JSON.parse(assets); } catch { assets = null; }
        }
        return [assets?.baseUrl, row.portalUrl];
      })
      .map(originOf)
      .filter(Boolean);
    partnerOriginsCache = { origins, loadedAt: Date.now() };
  } catch (error) {
    customLog(null, "error", { message: "Could not load partner portal origins", error: error?.message }, "CONSOLE");
  }
  return partnerOriginsCache.origins;
};

const isLocalDevOrigin = (origin) =>
  process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// Domains anyone can get a subdomain on — a platform URL hosted there must not make all its siblings trusted.
const SHARED_HOSTING_DOMAINS = [
  "vercel.app", "netlify.app", "herokuapp.com", "web.app", "firebaseapp.com", "run.app", "appspot.com",
  "azurewebsites.net", "cloudfront.net", "amplifyapp.com", "github.io", "onrender.com", "pages.dev",
  "workers.dev", "ngrok.io", "ngrok-free.app",
];

// The platform's own domains (peko.one from in.peko.one, pekoapp.com from uatin.pekoapp.com). Every
// environment's frontend lives on one of them, so an https subdomain of these is ours even when this
// service's env names a sibling (e.g. uatin.peko.one vs uatin.pekoapp.com).
const platformDomains = () =>
  [
    process.env.FRONTEND_PRODUCTION_URL,
    process.env.FRONTEND_STAGING_URL,
    process.env.IDP_FRONTEND_URL,
    ...partnerLogos.map((partner) => partner?.baseUrl),
  ]
    .map(originOf)
    .filter(Boolean)
    .map((origin) => {
      const labels = new URL(origin).hostname.split(".");
      if (labels.length < 2 || /^\d+$/.test(labels[labels.length - 1])) return null;
      return (labels.length >= 3 ? labels.slice(1) : labels).join(".");
    })
    .filter((domain) => domain && domain.includes(".") && !SHARED_HOSTING_DOMAINS.includes(domain));

const isPlatformSubdomain = (origin) => {
  const { protocol, hostname } = new URL(origin);
  if (protocol !== "https:") return false;
  return platformDomains().some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
};

const isTrustedOrigin = async (origin) =>
  isLocalDevOrigin(origin) ||
  staticOrigins().includes(origin) ||
  isPlatformSubdomain(origin) ||
  (await partnerOrigins()).includes(origin);

/**
 * The base URL to put in an emailed link: the requested one when it is ours, otherwise the partner's portal
 * (for a partner-registered account) or the platform frontend.
 * @param {string} requestedUrl - baseUrl sent by the client (may be missing or hostile)
 * @param {string|number|null} partnerId - registeredBy of the account the link is for
 */
const resolveFrontendBaseUrl = async (requestedUrl, partnerId = null) => {
  const requestedOrigin = originOf(requestedUrl);
  if (requestedOrigin) {
    if (await isTrustedOrigin(requestedOrigin)) return withoutTrailingSlash(requestedUrl);
    customLog(null, "error", { message: "Untrusted frontend baseUrl ignored", requestedOrigin }, "CONSOLE");
  }
  let partnerUrl = null;
  if (partnerId) {
    try {
      partnerUrl = await fetchPartnerBaseUrl(partnerId);
    } catch {
      partnerUrl = null;
    }
  }
  return withoutTrailingSlash(partnerUrl || platformFrontendUrl());
};

// Route guard for authenticated invite/resend endpoints: replaces body.baseUrl with a trusted one before the
// controller builds any emailed link from it.
const sanitizeBodyBaseUrl = async (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body.baseUrl = await resolveFrontendBaseUrl(req.body.baseUrl, req.user?.registeredBy || null);
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { resolveFrontendBaseUrl, sanitizeBodyBaseUrl };
