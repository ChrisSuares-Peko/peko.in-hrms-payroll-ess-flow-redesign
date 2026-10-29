/**
 * Admin path + Redis session role checks for /api/v1/system_user/:userId/...
 * Role must come from Redis userData_{userId}_{sessionId}, not a client claim.
 */

/** `/api/v1/system_user/:userId/...` — admin routes only. */
function parseSystemUserPath(url) {
  const pathOnly = String(url || "").split("?")[0];
  const match = pathOnly.match(/^\/api\/v1\/system_user\/([^/]+)/i);
  if (!match) return null;
  return { pathUserId: match[1] };
}

/**
 * Role comes from Redis session state (`userData_{userId}_{sessionId}`),
 * not from a client-supplied header. Corporate sessions cannot call admin APIs.
 */
function assertSystemUserSession(userDataRaw, pathUserId) {
  let sessionUser;
  try {
    sessionUser = typeof userDataRaw === "string" ? JSON.parse(userDataRaw) : userDataRaw;
  } catch (_) {
    return { ok: false, message: "Invalid session" };
  }
  if (!sessionUser || sessionUser.role !== "SYSTEM_USER") {
    return { ok: false, message: "Unauthorized access." };
  }
  if (pathUserId != null && String(pathUserId) !== String(sessionUser.id)) {
    return { ok: false, message: "Unauthorized access." };
  }
  return { ok: true, sessionUser };
}

/**
 * Service-proxy paths `/api/v1/:userType/:userId/<service>/...` — bind the `:userId`
 * segment to the caller's own session so one tenant cannot act on another (F-GW-01).
 * The id in the path legitimately appears as the credential id (from the frontend),
 * the corporateId or the subCorporateId (from internal service-to-service calls),
 * so any of the caller's own ids is accepted; anything else is rejected.
 */
const SERVICE_SEGMENTS = new Set([
  "purchase", "payment", "travel", "officeAndBusiness", "others", "kyc",
  "payment-gateway", "payroll", "scheduler", "corporate-cards",
]);

// Routes shaped like /:userType/:x/<service>/... where :x is NOT a user id (a vendor slug),
// so there is nothing to bind to the session. Exact paths only — never prefixes.
// Login is still required for these; only the path-owner check is skipped.
const PATH_OWNER_EXEMPT = new Set([
  "/api/v1/vendor/countryFlag/travel/flags",
]);

function parseCorporatePath(url) {
  const pathOnly = String(url || "").split("?")[0];
  if (PATH_OWNER_EXEMPT.has(pathOnly)) return null;
  const m = pathOnly.match(/^\/api\/v1\/([^/]+)\/([^/]+)\/([^/]+)/);
  if (!m) return null;
  const [, userType, pathUserId, service] = m;
  if (userType === "system_user") return null; // handled by assertSystemUserSession
  if (!SERVICE_SEGMENTS.has(service)) return null;
  return { pathUserId };
}

function assertSessionOwnsPath(userDataRaw, pathUserId) {
  let sessionUser;
  try {
    sessionUser = typeof userDataRaw === "string" ? JSON.parse(userDataRaw) : userDataRaw;
  } catch (_) {
    return { ok: false, message: "Invalid session" };
  }
  if (!sessionUser) return { ok: false, message: "Invalid session" };
  const ownIds = [sessionUser.id, sessionUser.corporateId, sessionUser.subCorporateId]
    .filter((v) => v !== undefined && v !== null && v !== "")
    .map(String);
  if (ownIds.includes(String(pathUserId))) return { ok: true, sessionUser };
  return { ok: false, message: "Unauthorized access." };
}

module.exports = {
  parseSystemUserPath,
  assertSystemUserSession,
  parseCorporatePath,
  assertSessionOwnsPath,
};
