const { customLog } = require("../../utils/loggerHelper");
const oauth_providers = require("../entities/oauth_providers");

const DEFAULT_OAUTH_SCOPE = "openid profile email offline_access";

// Every config field an OAuth client needs.
const CONFIG_FIELDS = [
  "issuer",
  "client_id",
  "client_secret",
  "redirect_uri",
  "scope",
];

/**
 * Fetch OAuth provider details from the database based on the registeredBy identifier.
 *
 * @param {string|null} registeredBy - Identifier for the OAuth provider.
 * @param {Array<string>} attributes - Deprecated and ignored. All config fields are always returned.
 * @returns {Promise<{issuer: string, client_id: string, client_secret: string, redirect_uri: string, scope: string}|null>}
 */
// eslint-disable-next-line no-unused-vars
exports.findOauthProviderDetails = async (registeredBy, attributes = undefined) => {
  try {
    const provider = await oauth_providers.findOne({
      where: {
        registeredBy: registeredBy || null,
      },
      attributes: CONFIG_FIELDS,
      // registeredBy has no unique index, so pin the row to keep the resolved
      // config stable across requests if duplicates ever exist.
      order: [["id", "DESC"]],
      raw: true,
      nest: true,
    });
    if (!provider) {
      customLog(null, "error", {
        msg: "No oauth provider configured for registeredBy:",
        registeredBy: registeredBy || null,
      });
      return null;
    }
    const filled = {};
    const missing = [];
    for (const field of CONFIG_FIELDS) {
      const value = provider[field];
      if (value === null || value === undefined || value === "") {
        missing.push(field);
      } else {
        filled[field] = value;
      }
    }
    if (!filled.scope) {
      filled.scope = DEFAULT_OAUTH_SCOPE;
    }
    const required = ["issuer", "client_id", "client_secret", "redirect_uri"];
    const missingRequired = required.filter((f) => !filled[f]);
    if (missingRequired.length) {
      customLog(null, "error", {
        msg: "Oauth provider row incomplete, refusing to use it:",
        registeredBy: registeredBy || null,
        missing,
      });
      return null;
    }
    return filled;
  } catch (error) {
    customLog(null, "error", {
      msg: "Oauth provider fetching from DB failed:",
      error,
    });
    return null;
  }
};
