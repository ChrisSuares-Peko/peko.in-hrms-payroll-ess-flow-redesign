const router = (module.exports = require("express")());
const crypto = require("crypto");
const uuid = require("uuid").v4;

const { signIdpToken, verifyIdpToken } = require("../../../utils/idpToken");
const { findOneCredential } = require("../../../models/use-cases/credential");
const {
  findOneWithCredentialId,
} = require("../../../models/use-cases/corporateUser");
const ErrorResponse = require("../../../utils/error-response");
const { idpFail } = require("../../../utils/idpError");
const { customLog } = require("../../../utils/loggerHelper");
const {
  findOauthClientDetails,
} = require("../../../models/use-cases/oauth_clients");
const {
  setValue,
  getValue,
  deleteKey,
} = require("../../../utils/cacheDataMethods");
const {
  validateOAuthConsentRequest,
  validateOAuthTokenRequest,
  validateAuthorizeRequest,
} = require("../../../utils/apiValidation");
const {
  findOauthConsentDetails,
  createOrUpdateOauthConsent,
  findAllOauthConsentsByCredential,
  deleteOauthConsent,
} = require("../../../models/use-cases/oauth_consents");
const { verifyToken, resolveSessionUser } = require("../../../utils/jwtToken");
const {
  getAccessDetails,
  checkPartnerAccess,
  sendUnauthorized,
} = require("../../../services/authHelper");
const {
  fetchPartnerDetails,
  fetchPartnerBaseUrl,
} = require("../../../models/use-cases/systemUser");

const ISSUER = process.env.IDP_ISSUER;
const FRONTEND_URI = process.env.IDP_FRONTEND_URL;
const IDP_TOKEN_EXPIRY = "1h";
const IDP_REFRESH_TOKEN_EXPIRY = "1d";
// Auth codes are redeemed by the client's backend right after the redirect; a short life limits replay.
const IDP_CODE_EXPIRY = "10m";

const scopeMap = {
  openid: ["credentialId"],
  profile: [
    "name",
    "contactPersonName",
    "country",
    "city",
    "logo",
    "website",
    "designation",
  ],
  phone: ["mobileNo", "countryCode"],
  email: ["email"],
};

router.get("/authorize", validateAuthorizeRequest, async (req, res, next) => {
  try {
    const { client_id, redirect_uri } = req.query;

    const client = await findOauthClientDetails(client_id);
    if (!client || !client.redirect_uris.includes(redirect_uri)) {
      return idpFail(req, next, {
        reason: client
          ? "authorize_redirect_uri_not_registered"
          : "authorize_unknown_client",
        details: { client_id, redirect_uri },
      });
    }
    const { client_name, logo_uri } = client;

    let frontendUri = client.frontend_url || FRONTEND_URI;
    try {
      const registeredBy = getRegisteredByFromState(req.query.state);
      if (registeredBy) {
        const partnerBaseUrl = await fetchPartnerBaseUrl(registeredBy);
        if (partnerBaseUrl) frontendUri = partnerBaseUrl;
      }
    } catch (err) {
      customLog(req?.LogTraceId, "error", {
        msg: "Partner frontend resolution failed; using default frontend",
        err,
      });
    }

    const token = signIdpToken(
      { ...req.query, sub: uuid(), client_name, logo_uri },
      {
        expiresIn: IDP_TOKEN_EXPIRY,
      }
    );

    customLog(req?.LogTraceId, "info", {
      msg: "Authorize successful",
      client_id,
      redirect_uri,
      frontendUri,
    });
    return res.redirect(`${frontendUri}/auth/login?token=${token}`);
  } catch (err) {
    customLog(req?.LogTraceId, "error", { msg: "Authorize error", err });
    return next(
      new ErrorResponse("Something went wrong, Try again later!", 500)
    );
  }
});

router.get("/consent", async (req, res, next) => {
  const { client_id, scope } = req.query;
  // Answer for the logged-in user when a session is presented; the query user_id is only a fallback.
  const sessionUser = await resolveSessionUser(req).catch(() => null);
  const user_id = sessionUser?.id || req.query.user_id;
  if (!client_id || !user_id || !scope) {
    return next(
      new ErrorResponse("client_id, user_id and scope are required", 400)
    );
  }
  try {
    const consent = await findOauthConsentDetails(user_id, client_id, [
      "scopes",
    ]);
    const approvedScopes = consent?.scopes || [];
    const requestedScopes = scope ? scope.split(" ") : [];
    const newScopes = requestedScopes.filter(
      (s) => !approvedScopes.includes(s)
    );
    return res.status(200).json({
      status: true,
      message: "Consent status fetched successfully",
      data: { consentRequired: newScopes.length > 0 },
      responseCode: "000",
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { msg: "Consent status error", err });
    return next(
      new ErrorResponse("Something went wrong, Try again later!", 500)
    );
  }
});

router.post("/consent", validateOAuthConsentRequest, async (req, res, next) => {
  const { token } = req.body;

  // The code is issued for the logged-in user only. The body's user.id is never trusted: anyone holding a
  // bridge token could otherwise mint a code (and so a full session) for any credential id.
  const sessionUser = await resolveSessionUser(req).catch(() => null);
  if (!sessionUser?.id) {
    return next(new ErrorResponse("Session expired or invalid", 401));
  }
  if (req.body.user?.id && String(req.body.user.id) !== String(sessionUser.id)) {
    return idpFail(req, next, {
      reason: "consent_user_mismatch",
      status: 403,
      message: "Consent must be given by the logged-in user",
      details: { sessionUser: sessionUser.id },
    });
  }
  const user = { id: sessionUser.id };

  try {
    const { client_id, redirect_uri, code_challenge, state, scope, nonce } =
      verifyIdpToken(token);

    const client = await findOauthClientDetails(client_id);
    if (!client) {
      return idpFail(req, next, {
        reason: "consent_unknown_client",
        details: { client_id },
      });
    }
    if (client.active === false) {
      return idpFail(req, next, {
        reason: "consent_client_inactive",
        details: { client_id },
      });
    }
    // Guards against the code being delivered to an attacker-chosen URL.
    if (
      !Array.isArray(client.redirect_uris) ||
      !client.redirect_uris.includes(redirect_uri)
    ) {
      return idpFail(req, next, {
        reason: "consent_redirect_uri_not_registered",
        details: { client_id, redirect_uri },
      });
    }

    const code = crypto.randomBytes(8).toString("hex");
    const codeData = JSON.stringify({
      client_id,
      redirect_uri,
      user_id: user.id,
      code_challenge,
      code_challenge_method: "S256",
      scope,
      nonce,
    });
    await setValue(
      `oauth_code_${code}`,
      expiryCalculationFn(IDP_CODE_EXPIRY),
      codeData
    );

    const redirect = new URL(redirect_uri);
    redirect.searchParams.set("code", code);
    if (state) redirect.searchParams.set("state", state);

    // Store or update consent
    await createOrUpdateOauthConsent(user.id, client_id, scope.split(" "));

    customLog(req?.LogTraceId, "info", {
      msg: "Consent successful",
      user: user.id,
      client_id,
      redirect_uri: redirect.toString(),
    });
    return res.status(200).json({
      status: true,
      message: "Consent successful",
      data: { redirectUrl: redirect.toString() },
      responseCode: "000",
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { msg: "Consent error", err });
    return next(new ErrorResponse("Invalid or expired token", 400));
  }
});

// List the apps the authenticated user has consented to (Connected Apps).
router.get("/consents", verifyToken, async (req, res, next) => {
  try {
    const credentialId = req.user?.id;
    if (!credentialId) {
      return next(new ErrorResponse("Unauthorized", 401));
    }

    const consents = await findAllOauthConsentsByCredential(credentialId);
    if (consents === false) {
      return next(
        new ErrorResponse("Something went wrong, Try again later!", 500)
      );
    }

    const apps = await Promise.all(
      (consents || []).map(async (consent) => {
        const client = await findOauthClientDetails(consent.client_id, [
          "client_name",
          "logo_uri",
        ]);
        return {
          id: consent.id,
          client_id: consent.client_id,
          client_name: client?.client_name || consent.client_id,
          logo_uri: client?.logo_uri || null,
          scopes: consent.scopes || [],
          grantedAt: consent.updatedAt,
        };
      })
    );

    return res.status(200).json({
      status: true,
      message: "Connected apps fetched successfully",
      data: { apps },
      responseCode: "000",
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { msg: "List consents error", err });
    return next(
      new ErrorResponse("Something went wrong, Try again later!", 500)
    );
  }
});

// Revoke (delete) a consent the authenticated user previously granted.
router.delete("/consents/:id", verifyToken, async (req, res, next) => {
  try {
    const credentialId = req.user?.id;
    const { id } = req.params;
    if (!credentialId) {
      return next(new ErrorResponse("Unauthorized", 401));
    }

    const deleted = await deleteOauthConsent(id, credentialId);
    if (deleted === false) {
      return next(
        new ErrorResponse("Something went wrong, Try again later!", 500)
      );
    }
    if (!deleted) {
      return next(new ErrorResponse("Consent not found", 404));
    }

    customLog(req?.LogTraceId, "info", {
      msg: "Consent revoked",
      user: credentialId,
      consentId: id,
    });
    return res.status(200).json({
      status: true,
      message: "Access revoked successfully",
      data: {},
      responseCode: "000",
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { msg: "Revoke consent error", err });
    return next(
      new ErrorResponse("Something went wrong, Try again later!", 500)
    );
  }
});

router.post("/token", validateOAuthTokenRequest, async (req, res, next) => {
  try {
    const {
      code,
      code_verifier,
      client_id,
      redirect_uri,
      grant_type,
      refresh_token,
    } = req.body;

    // Check client authentication
    const authHeader = req.headers.authorization;
    let clientSecret;

    if (authHeader && authHeader.startsWith("Basic ")) {
      const base64 = authHeader.split(" ")[1];
      const [cid, csecret] = Buffer.from(base64, "base64")
        .toString()
        .split(":");
      if (cid !== client_id) {
        return idpFail(req, next, {
          reason: "token_basic_auth_client_id_mismatch",
          status: 401,
          message: "Invalid client authentication",
          details: { client_id },
        });
      }
      clientSecret = csecret;
    } else if (req.body.client_secret) {
      clientSecret = req.body.client_secret;
    }

    const client = await findOauthClientDetails(client_id);
    if (!client || !secretsMatch(client.client_secret, clientSecret)) {
      return idpFail(req, next, {
        reason: client ? "token_client_secret_mismatch" : "REDACTED",
        status: 401,
        message: "Invalid client authentication",
        details: { client_id },
      });
    }

    if (grant_type === "refresh_token") {
      let session = await getValue(`oauth_refresh_tkn_${refresh_token}`);
      session = JSON.parse(session);
      if (!session)
        return idpFail(req, next, {
          reason: "token_refresh_token_not_found",
          status: 401,
          message: "Invalid grant",
          details: { client_id },
        });
      // A refresh token is redeemable only by the client it was issued to. Tokens issued before the
      // client_id was recorded carry none and stay valid until their (1 day) expiry.
      if (session.client_id && session.client_id !== client_id)
        return idpFail(req, next, {
          reason: "token_refresh_token_client_mismatch",
          status: 401,
          message: "Invalid grant",
          details: { client_id },
        });

      const access_token = signIdpToken(
        { sub: session.user_id, scope: session.scope },
        { expiresIn: IDP_TOKEN_EXPIRY }
      );

      return res.status(200).json({
        status: true,
        message: "Token fetched successfully",
        data: {
          access_token,
          token_type: "Bearer",
          expires_in: expiryCalculationFn(IDP_TOKEN_EXPIRY),
        },
        responseCode: "000",
      });
    }

    let record = await getValue(`oauth_code_${code}`);
    record = JSON.parse(record);

    if (
      !record ||
      record.client_id !== client_id ||
      record.redirect_uri !== redirect_uri
    ) {
      let reason = "token_code_not_found";
      if (record && record.client_id !== client_id)
        reason = "token_code_client_mismatch";
      else if (record) reason = "token_code_redirect_uri_mismatch";
      // Single attempt: a code presented wrongly is burnt so it cannot be retried.
      if (record) await deleteKey(`oauth_code_${code}`);
      return idpFail(req, next, {
        reason,
        message: "Invalid grant",
        details: { client_id, redirect_uri },
      });
    }

    const hashed = crypto
      .createHash("sha256")
      .update(code_verifier)
      .digest("base64url");
    if (hashed !== record.code_challenge) {
      await deleteKey(`oauth_code_${code}`);
      return idpFail(req, next, {
        reason: "token_pkce_verifier_mismatch",
        message: "Invalid grant",
        details: { client_id },
      });
    }

    const userDetails = await findOneCredential({ id: record.user_id }, [
      "id",
      "name",
      "username",
      "role",
      "email",
    ]);

    if (!userDetails) {
      return idpFail(req, next, {
        reason: "token_user_missing_for_code",
        message: "Invalid grant",
        details: { client_id, user_id: record.user_id },
      });
    }

    const access_token = signIdpToken(
      { sub: record.user_id, scope: record.scope },
      { expiresIn: IDP_TOKEN_EXPIRY }
    );

    const id_token = signIdpToken(
      {
        sub: record.user_id,
        name: userDetails.name,
        email: userDetails.email,
        iss: ISSUER,
        aud: client_id,
        // Echoed back when the client sent one: libraries that generate a nonce
        // on the code flow reject an id_token that omits it.
        ...(record.nonce ? { nonce: record.nonce } : {}),
      },
      { expiresIn: IDP_TOKEN_EXPIRY }
    );

    let response = {
      access_token,
      token_type: "Bearer",
      expires_in: expiryCalculationFn(IDP_TOKEN_EXPIRY),
      id_token,
    };

    if (record.scope && record.scope.includes("offline_access")) {
      const refresh_token = crypto.randomBytes(32).toString("hex");
      const refreshTokenData = JSON.stringify({
        user_id: record.user_id,
        scope: record.scope,
        client_id,
      });
      await setValue(
        `oauth_refresh_tkn_${refresh_token}`,
        expiryCalculationFn(IDP_REFRESH_TOKEN_EXPIRY),
        refreshTokenData
      );
      response.refresh_token = refresh_token;
    }

    await deleteKey(`oauth_code_${code}`);

    return res.status(200).json({
      status: true,
      message: "Token fetched successfully",
      data: {
        ...response,
      },
      responseCode: "000",
      access_token: response.access_token,
      token_type: "Bearer",
      expires_in: 3600,
      id_token: response.id_token,
      refresh_token: response.refresh_token
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { msg: "Token endpoint error", err });
    return next(
      new ErrorResponse("Something went wrong, Try again later!", 500)
    );
  }
});

router.get("/userinfo", async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return next(
      new ErrorResponse("Missing or malformed authorization header", 401)
    );
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = verifyIdpToken(token);

    const scopeList = decoded.scope ? decoded.scope.split(" ") : [];
    const attributes = [
      ...new Set(scopeList.flatMap((scope) => scopeMap[scope] || [])),
    ];

    const user = await findOneWithCredentialId(decoded.sub, attributes);
    if (!user) {
      return idpFail(req, next, {
        reason: "userinfo_subject_not_found",
        status: 401,
        message: "Invalid token",
        details: { sub: decoded.sub },
      });
    }

    return res.status(200).json({
      status: true,
      message: "User info fetched successfully",
      data: {
        ...user,
      },
      responseCode: "000",
    });
  } catch (e) {
    customLog(req?.LogTraceId, "error", {
      msg: "UserInfo error",
      name: e?.name,
      error: e?.message,
    });
    if (e.name === "TokenExpiredError") {
      return next(new ErrorResponse("Token expired", 401));
    } else if (e.name === "JsonWebTokenError") {
      return next(new ErrorResponse("Invalid token", 401));
    } else {
      return next(
        new ErrorResponse("Something went wrong, Try again later!", 500)
      );
    }
  }
});

router.get("/direct-active-session", verifyToken, async (req, res) => {
  try {
    const { redirectURI } = req.query;
    const sessionId = req.headers.sessionid;
    const userId = req.user?.id;
    const registeredBy = req.user?.registeredBy;
    if (!sessionId || !userId) {
      return res.status(400).json({
        status: false,
        message: "Invalid Session ID",
        data: {},
        responseCode: "001",
      });
    }
    const sessionData = await getValue(`userData_${userId}_${sessionId}`);
    const token = await getValue(`token_${userId}_${sessionId}`);
    const refreshToken = await getValue(`refreshToken_${userId}_${sessionId}`);
    if (!sessionData) {
      return res.status(404).json({
        status: false,
        message: "Session not found",
        data: {},
        responseCode: "001",
      });
    }
    const loginUserDetails = await findOneCredential({ id: userId });
    const {
      userProfileDetails,
      role,
      roleName,
      corporateUserId,
      subCorporateData,
    } = await getAccessDetails(loginUserDetails, registeredBy);
    const { midPending, isSuccess } = await checkPartnerAccess(
      registeredBy,
      registeredBy,
      loginUserDetails
    );
    if (!isSuccess) {
      return sendUnauthorized(res, "Access denied.");
    }
    const partnerDetails = await fetchPartnerDetails(registeredBy);
    const resToken = signIdpToken(
      {
        token,
        refreshToken,
        role: role.toLowerCase(),
        roleName,
        id: loginUserDetails.id,
        corporateId: corporateUserId,
        username: loginUserDetails.username,
        sessionId,
        packageName: userProfileDetails?.package?.packageName,
        subCorporateId: subCorporateData?.id || null,
        midPending,
        branding: partnerDetails?.branding || "Peko",
        redirectURI,
      },
      {
        expiresIn: IDP_TOKEN_EXPIRY,
      }
    );

    return res.redirect(
      `${partnerDetails?.baseUrl || FRONTEND_URI}/auth/login?token=${resToken}`
    );
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      msg: "Direct active session error",
      message: err?.message,
      data: err?.response?.data,
      stack: err?.stack,
    });
    return res.status(500).json({
      status: false,
      message: "Something went wrong, Try again later!",
      data: {},
      responseCode: "001",
      traceId: req?.LogTraceId,
    });
  }
});

// Partner clients encode { ..., registeredBy } as base64url JSON in the OIDC `state`.
// Returns the partner's registeredBy (systemUser credential id) or null.
function getRegisteredByFromState(state) {
  if (!state || typeof state !== "string") return null;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const registeredBy = decoded && decoded.registeredBy;
    return typeof registeredBy === "string" || typeof registeredBy === "number"
      ? String(registeredBy)
      : null;
  } catch {
    return null;
  }
}

// Constant-time compare so the client secret cannot be recovered byte-by-byte from response timing.
function secretsMatch(stored, presented) {
  if (typeof stored !== "string" || typeof presented !== "string") return false;
  const a = crypto.createHash("sha256").update(stored).digest();
  const b = crypto.createHash("sha256").update(presented).digest();
  return crypto.timingSafeEqual(a, b);
}

function expiryCalculationFn(expiry) {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}
