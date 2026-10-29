const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

/**
 * Signing/verification for the OIDC IdP flow — the /authorize bridge token, the issued
 * access_token and id_token, the /direct-active-session bridge token, and the /token-exchange
 * verify that consumes them.
 *
 * This replaces the shared HS256 secret from
 * configs/keys.json, whose value was committed to the repo and therefore let anyone holding it
 * forge an access token for an arbitrary `sub`.
 *
 * Wrapped in helpers rather than exporting the key so no call site can forget `algorithm` and
 * silently fall back to jsonwebtoken's default.
 */
// Prefer the key from Secret Manager (Cloud Run --set-secrets); fall back to the file for local dev.
const privateKey = process.env.JWT_PRIVATE_KEY
  ? process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n")
  : fs.readFileSync(path.join(__dirname, "..", "keys", "rsa.key"), "utf8");
const publicKey = fs.readFileSync(path.join(__dirname, "..", "keys", "rsa.key.pub"), "utf8");

exports.signIdpToken = (payload, options = {}) =>
  jwt.sign(payload, privateKey, { ...options, algorithm: "RS256" });

exports.verifyIdpToken = (token) =>
  jwt.verify(token, publicKey, { algorithms: ["RS256"] });
