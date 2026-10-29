const crypto = require("crypto");
const { customLog } = require("../../utils/loggerHelper");
const oauth_clients = require("../entities/oauth_clients");

/**
 * Create a new OAuth client record
 * @param {Object} payload
 * @param {string} payload.client_name - Name of the client
 * @param {string} payload.logo_uri - Logo URL
 * @param {string} payload.frontend_url - Client frontend origin (consent redirect target)
 * @param {Array<string>} payload.redirect_uris - Redirect URIs
 * @returns {Object|boolean} Created client record or false
 */
exports.createOauthClient = async ({
  client_name = null,
  logo_uri = null,
  frontend_url = null,
  redirect_uris = [],
}) => {
  try {
    // Generate unique client_id and client_secret
    const client_id = crypto.randomBytes(16).toString("hex");
    const client_secret = crypto.randomBytes(32).toString("hex");

    const client = await oauth_clients.create({
      client_name,
      client_id,
      client_secret,
      logo_uri,
      frontend_url,
      redirect_uris,
    });

    return client.get({ plain: true });
  } catch (error) {
    customLog(null, "error", {
      msg: "Oauth Client creation failed:",
      error,
    });
    return false;
  }
};

/**
 * Update an OAuth client record
 * @param {string} client_id - The client ID of the record to update
 * @param {Object} updates - Fields to update (client_name, logo_uri, redirect_uris, etc.)
 * @param {string} updates.client_name - Name of the client
 * @param {string} updates.logo_uri - Logo URL
 * @param {string} updates.frontend_url - Client frontend origin (consent redirect target)
 * @param {Array<string>} updates.redirect_uris - Redirect URIs
 * @param {boolean} updates.active - Client credentials Active
 * @returns {Object|boolean} Updated client record or false
 */
const UPDATABLE_FIELDS = [
  "client_name",
  "logo_uri",
  "frontend_url",
  "redirect_uris",
  "active",
];

exports.updateOauthClient = async (client_id, updates = {}) => {
  try {
    // Only write the fields the caller actually sent. Defaulting them instead
    // would let a form that omits redirect_uris wipe a live client's registered
    // callbacks (and silently re-activate a disabled one).
    const changes = {};
    for (const field of UPDATABLE_FIELDS) {
      if (updates[field] !== undefined) changes[field] = updates[field];
    }

    if (!Object.keys(changes).length) return [0];

    const client = await oauth_clients.update(changes, {
      where: { client_id },
    });

    return client;
  } catch (error) {
    customLog(null, "error", {
      msg: "Oauth Client update failed:",
      error,
    });
    return false;
  }
};

/**
 * Delete an OAuth client record
 * @param {string} client_id - The client ID of the record to delete
 * @returns {boolean} true if deleted, false if not
 */
exports.deleteOauthClient = async (client_id) => {
  try {
    const deleted = await oauth_clients.destroy({
      where: { client_id },
    });

    return deleted > 0; // true if at least one row deleted
  } catch (error) {
    customLog(null, "error", {
      msg: "Oauth Client delete failed:",
      error,
    });
    return false;
  }
};
