const express = require("express");
const { OAuthLoginCallback } = require("../../../controllers/admin/signUp");
const { getValue } = require("../../../utils/cacheDataMethods");
const { v4 } = require("uuid");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { customLog } = require("../../../utils/loggerHelper");
const { findOauthProviderDetails } = require("../../../models/use-cases/oauth_providers");
const { findOne: findOneCorporate } = require("../../../models/use-cases/corporateUser");
const router = express.Router();
const FRONTEND_BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;

router.get("/login", async (req, res) => {
  customLog(req?.LogTraceId, "info", {
    message: "OAuth Login - ",
    sessionID: req?.sessionID || "N/A",
  });
  const { service, partnerId } = req.query;
  const providerDetails = await findOauthProviderDetails(partnerId || null, ["client_id", "redirect_uri", "issuer", "scope"]);
  if (!providerDetails) {
    customLog(req?.LogTraceId, "error", {
      message: "OAuth provider not configured",
      partnerId: partnerId || null,
    });
    return res.status(500).json({ error: "OAuth provider not configured" });
  }
  const { client_id, issuer, redirect_uri, scope } = providerDetails;

  if (req.session.tokens && new Date() < new Date(req.session.tokens.expiry)) {
    customLog(req?.LogTraceId, "info", {
      message: "Session already exists with valid tokens",
    });
    const { uuid } = req.session.tokens;
    let token = await getValue(`token_${uuid}`);
    if (token) {
      let userData = await getValue(`userData_${uuid}`);
      let refreshToken = await getValue(`refreshToken_${uuid}`);
      let oauth_refreshToken = await getValue(`oauth_refreshToken_${uuid}`);
      const {
        name,
        contactPersonName,
        mobileNo,
        role,
        id,
        username,
        corporateId,
        subCorporateId,
        partnerPortalUrl,
        branding,
        roleName,
      } = JSON.parse(userData);

      const corporate = await findOneCorporate({ id });
      customLog(req?.LogTraceId, "info", {
        message: "Warm session profile refreshed from DB",
        credentialId: id,
        refreshed: !!corporate,
      });

      let resolvedRoleName = roleName;
      if (role === "CORPORATE") {
        resolvedRoleName = "corporate";
      } else if (role === "SYSTEM_USER" && username === "pekopayments") {
        resolvedRoleName = "admin";
      } else if (role === "SYSTEM_USER" && username === "ecommanager") {
        resolvedRoleName = "ecom_manager";
      }

      return res.redirect(
        `${
          partnerPortalUrl || FRONTEND_BASE_URL
        }/social?status=true&message=Login successful&data=${encodeURIComponent(
          JSON.stringify({
            name: corporate?.name ?? name,
            contactPersonName: corporate?.contactPersonName ?? contactPersonName,
            mobileNo: corporate?.mobileNo ?? mobileNo,
            role: typeof role === "string" ? role.toLowerCase() : role,
            roleName: resolvedRoleName,
            id,
            username,
            corporateId,
            subCorporateId: subCorporateId || null,
            branding,
            sessionId: v4(),
            token,
            refreshToken,
            oauth_refreshToken,
            sessionUUID: uuid,
            service,
          })
        )}&responseCode=000`
      );
    } else {
      customLog(req?.LogTraceId, "info", {
        message: "No cached token found for UUID",
      });
    }
  }
  const configUrl = `${issuer}/.well-known/openid-configuration`;
  let authzEndpoint = `${issuer}/authorize`;
  try {
    const { data } = await axios.get(configUrl);
    authzEndpoint = data.authorization_endpoint;
    customLog(req?.LogTraceId, "info", {
      idpCall: "discovery",
      message: "IdP discovery resolved authorize endpoint",
      partnerId,
      issuer,
      configUrl,
      authzEndpoint,
      scope,
    });
  } catch(err) {
    customLog(req?.LogTraceId, "error", {
      idpCall: "discovery",
      message: "IdP discovery request failed",
      partnerId,
      issuer,
      configUrl,
      httpStatus: err?.response?.status,
      idpResponse: err?.response?.data,
      errorMsg: err?.message,
    });
    return res.status(500).json({ error: "Failed to fetch OpenID config" });
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  req.session.codeVerifier = codeVerifier;
  customLog(req?.LogTraceId, "info", {
    message: "Generated code verifier and challenge",
    sessionID: req?.sessionID || "N/A",
  });

  const statePayload = {
    service,
    partnerId,
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  const authUrl =
    `${authzEndpoint}?` +
    new URLSearchParams({
      client_id: client_id,
      response_type: "code",
      scope: scope,
      redirect_uri: redirect_uri,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce: require("crypto").randomBytes(16).toString("base64url"),
    }).toString();

  // Ensure session is saved before redirect so codeVerifier persists
  return req.session.save((err) => {
    if (err) {
      customLog(req?.LogTraceId, "error", {
        message: "Failed to save session before OAuth redirect",
        errorMsg: err.message,
        error: err,
      });
    }
    res.redirect(authUrl);
  });
});

const callbackMiddleware = async (req, res, next) => {
  let { code, state } = req.query;
  if (code) {
    const { codeVerifier } = req.session;
    customLog(req?.LogTraceId, "info", {
      message: "OAuth Callback - ",
      sessionID: req?.sessionID || "N/A",
      state,
    });

    if (!code || !codeVerifier)
      return res.status(400).send("Missing code or verifier");

    let decodedState = {};
    if (state) {
      try {
        decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      } catch (err) {
        customLog(req?.LogTraceId, "error", {...err, message: 'Failed to parse state:'})
      }
    }
    const {partnerId = null} = decodedState;
    const providerDetails = await findOauthProviderDetails(partnerId, ["client_id", "redirect_uri", "issuer", "client_secret"]);
    if (!providerDetails) {
      customLog(req?.LogTraceId, "error", {
        message: "OAuth provider not configured on callback",
        partnerId,
      });
      return next();
    }
    const { client_id, client_secret, issuer, redirect_uri } = providerDetails;

    const configUrl = `${issuer}/.well-known/openid-configuration`;
    let tokenEndpoint = `${issuer}/oauth/token`;

    try {
      const { data } = await axios.get(configUrl);
      tokenEndpoint = data.token_endpoint;
      customLog(req?.LogTraceId, "info", {
        idpCall: "discovery",
        message: "IdP discovery resolved token endpoint",
        partnerId,
        issuer,
        configUrl,
        tokenEndpoint,
      });
    } catch (err) {
      customLog(req?.LogTraceId, "error", {
        idpCall: "discovery",
        message: "IdP discovery request failed",
        partnerId,
        issuer,
        configUrl,
        httpStatus: err?.response?.status,
        idpResponse: err?.response?.data,
        errorMsg: err?.message,
      });
      return res.status(500).send("Failed to fetch OpenID config");
    }

    try {
      // Convert payload to x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("client_id", client_id);
      params.append("client_secret", client_secret);
      params.append("code", code);
      params.append("redirect_uri", redirect_uri);
      params.append("code_verifier", codeVerifier);

      customLog(req?.LogTraceId, "info", {
        idpCall: "token",
        message: "IdP token request",
        partnerId,
        tokenEndpoint,
        grantType: "authorization_code",
        client_id,
        redirect_uri,
      });

      const tokenRes = await axios.post(tokenEndpoint, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const idToken = tokenRes.data.id_token;
      const decoded = jwt.decode(idToken);

      const oauthPayload = {
        decoded,
        idToken,
        accessToken: tokenRes.data.access_token,
        refreshToken: tokenRes.data.refresh_token,
      };
      customLog(
        req?.LogTraceId,
        "info",
        {
          idpCall: "token",
          message: "IdP token response",
          partnerId,
          tokenEndpoint,
          httpStatus: tokenRes?.status,
          tokenType: tokenRes?.data?.token_type,
          expiresIn: tokenRes?.data?.expires_in,
          scope: tokenRes?.data?.scope,
          fieldsReturned: Object.keys(tokenRes?.data || {}),
          hasRefreshToken: !!tokenRes?.data?.refresh_token,
          claims: decoded,
          response: tokenRes?.data,
        },
        "CONSOLE",
        ["id_token", "access_token", "refresh_token", "idToken", "accessToken", "refreshToken"]
      );
      const base64Encoded = Buffer.from(
        JSON.stringify(oauthPayload),
        "utf8"
      ).toString("base64");
      req.headers.oauth = base64Encoded;

      const uuid = decoded?.sub;
      // Save to session with real expiry time
      req.session.tokens = {
        uuid,
        expiry: new Date(decoded.exp * 1000),
      };
    } catch (err) {
      customLog(req?.LogTraceId, "error", {
        idpCall: "token",
        message: "IdP token request failed",
        partnerId,
        tokenEndpoint,
        httpStatus: err?.response?.status,
        idpResponse: err?.response?.data,
        errorMsg: err?.message,
        stack: err?.stack,
      });
    }
  }
  next();
};

router.get("/oauth-callback", callbackMiddleware, OAuthLoginCallback);

const generateCodeVerifier = () =>
  require("crypto").randomBytes(32).toString("hex");
const generateCodeChallenge = (verifier) => {
  return require("crypto")
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
};

module.exports = router;
