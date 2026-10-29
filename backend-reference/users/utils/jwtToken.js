/* eslint-disable no-undef */
const jwt = require("jsonwebtoken");
const { customLog } = require('./loggerHelper');
const { actingCredentialId } = require('./actingCredential');
const {
  findOne: findOneCorporateUser,
} = require("./../models/use-cases/corporateUser");
const { findOneCredential } = require("./../models/use-cases/credential");
const wallet = require("../models/entities/wallet");
const { checkAllPoliciesAccepted } = require("./../models/use-cases/privacyPolicy");
const { getValue, setValue } = require("./cacheDataMethods");
let serviceOperator = require("../models/entities/serviceOperator");
const disableServices = require("../models/entities/disabledService");
let cashback = require("../models/entities/cashback");
const fs = require("fs");
const path = require("path");

const privateKeyPath = path.join(__dirname, "..", "keys", "rsa.key");
// Prefer the key from Secret Manager (Cloud Run --set-secrets); fall back to the file for local dev.
const privateKey = process.env.JWT_PRIVATE_KEY
  ? process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n")
  : fs.readFileSync(privateKeyPath, "utf8");

exports.signToken = async (user) => {
  // eslint-disable-next-line no-undef
  let expiresIn;
    user?.autoLogin ? expiresIn = process.env.AUTO_LOGIN_ACCESS_TOKEN_EXPIRY : expiresIn = process.env.ACCESS_TOKEN_EXPIRY

  return jwt.sign(
    {
      username: user.username, // username of credential table
      role: user.role, // role of credential table
      userId: user.id, // id of merchant table
      roleName: user.roleName,
      subCorporateId: user.subCorporateId,
      type: "token",
    },
    privateKey,
    {
      issuer: process.env.ISSUER,
      subject: process.env.SUBJECT,
      audience: process.env.AUDIENCE,
      expiresIn: expiresIn,
      algorithm: "RS256",
    }
  );
};

exports.signRefreshToken = async (user) => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY;

  try {
    return jwt.sign(
      {
        username: user.username,
        role: user.role,
        userId: user.id,
        roleName: user.roleName,
        subCorporateId: user.subCorporateId,
        type: "refreshToken",
      },
      privateKey,
      {
        issuer: process.env.ISSUER,
        subject: process.env.SUBJECT,
        audience: process.env.AUDIENCE,
        expiresIn: expiresIn,
        algorithm: "RS256",
      }
    );
  } catch (error) {
    customLog(null, 'error', { message: 'Error signing refresh token', error: error.message }, 'CONSOLE');
    throw error;
  }
};

const expiryToSeconds = (expiry) => {
  const match = /^(\d+)([smhd])$/.exec(expiry || "");
  if (!match) return 3600;
  return parseInt(match[1], 10) * { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
};

// sync the per-session cached userData flag once the DB confirms acceptance
const refreshCachedPrivacyFlag = async (req) => {
  try {
    const sessionId = req.headers.sessionid;
    if (!sessionId) return;
    const redisKey = `userData_${req.user.id}_${sessionId}`;
    const cached = await getValue(redisKey);
    if (!cached) return;
    const parsed = JSON.parse(cached);
    parsed.hasAcceptedPrivacyPolicy = true;
    await setValue(redisKey, expiryToSeconds(process.env.ACCESS_TOKEN_EXPIRY), JSON.stringify(parsed));
  } catch (err) {
    customLog(null, 'error', { message: 'Failed to refresh cached privacy flag', error: err.message }, 'CONSOLE');
  }
};

exports.resolveSessionUser = async (req) => {
  const sessionKey = req.headers["x-user-key"];
  if (sessionKey) {
    const cached = await getValue(`userData_${sessionKey}`);
    if (!cached) return null;
    return typeof cached === "string" ? JSON.parse(cached) : cached;
  }
  const { userdata } = req.headers;
  if (!userdata) return null;
  return JSON.parse(decodeURI(userdata));
};

exports.verifyToken = async (req, res, next) => {
  try {
    req.user = await exports.resolveSessionUser(req);
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: 'Session expired or invalid',
        data: {},
        responseCode: '002'
      });
    }
     if (req.user.role === 'SYSTEM_USER') {
      return next();
    }
    if (req.path === '/privacy-policy') {
      return next();
    }
     // ✅ If already accepted (stored in Redis)
    if (req.user.hasAcceptedPrivacyPolicy) {
      return next();
    }

      if (
        Object.prototype.hasOwnProperty.call(req.user, "hasAcceptedPrivacyPolicy") &&
        req.user.hasAcceptedPrivacyPolicy === false
      )
        {
          // cached flag is a per-session copy and can be stale — recheck the DB before rejecting
          let accepted = false;
          try {
            const credentialId = actingCredentialId(req.user);
            accepted = await checkAllPoliciesAccepted({ credentialId });
          } catch (err) {
            customLog(null, 'error', { message: 'Privacy policy DB check failed', error: err.message }, 'CONSOLE');
          }

          if (!accepted) {
            return res.status(403).json({
              status: false,
              message: 'Privacy policy acceptance required',
              responseCode: '006',
              data:{}
            });
          }

          req.user.hasAcceptedPrivacyPolicy = true;
          await refreshCachedPrivacyFlag(req);
          return next();
      }
    
    next();
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      data: {},
      responseCode: err.message == "jwt expired" ? "002" : "001",
    });
  }
};

// adding req.user for webhooks
module.exports.findUserDetails = async function (userId) {
  let userDetails = await findOneCredential(
    {
      id: userId,
    },
    ["username", "name"]
  );
  let userData = {};
  userData["id"] = userId;
  userData["username"] =
    userDetails && userDetails["username"] ? userDetails["username"] : "";
  userData["name"] =
    userDetails && userDetails["name"] ? userDetails["name"] : "";
  const walletDetails = await wallet.findOne({
    where: {
      credentialId: userId,
    },
    attributes: ["balance"],
  });
  const details = await findOneCorporateUser(
    {
      id: userId,
    },
    [
      "packageId",
      "logo",
      "kycStatus",
      "isActive",
      "registeredBy",
      "id",
      "email",
      "tradeLicenseExpiry",
    ]
  );
  userData["packageId"] = details ? details["packageId"] : 1;
  userData["corporateId"] = details ? details["id"] : 1;
  userData["registeredBy"] = details ? details["registeredBy"] : 1;
  userData["tradeLicenseExpiry"] =
    details && details["tradeLicenseExpiry"] != null
      ? details["tradeLicenseExpiry"]
      : "Not Available";
  userData["balance"] =
    walletDetails && walletDetails["balance"]
      ? parseFloat(walletDetails["balance"]).toFixed(2)
      : 0.0;
  userData["kycStatus"] =
    details && details["kycStatus"] ? details["kycStatus"] : "Pending";
  userData["logo"] =
    details && details["logo"] ? details["logo"].toString() : "";
  userData["email"] = details && details["email"] ? details["email"] : "";

  let result = await cashback.findAll({
    include: [
      {
        model: serviceOperator,
        attributes: ["accessKey", "serviceCategory"],
      },
    ],
    where: {
      packageId: userData["packageId"],
      serviceStatus: true,
    },
    order: [["createdAt", "DESC"]],
    attributes: ["packageId"],
    raw: true,
    nest: true,
  });
  let disable = await disableServices.findAll({
    include: [
      {
        model: serviceOperator,
        attributes: ["accessKey"],
      },
    ],
    where: {
      serviceStatus: false,
    },
    order: [["createdAt", "DESC"]],
    attributes: ["serviceOperatorId"],
    raw: true,
    nest: true,
  });
  const disableService = disable.map((dt) => dt.serviceOperator.accessKey);
  if (result) {
    let serviceCategories = [];
    const accessKeys = result
      .filter((dt) => !disableService.includes(dt.serviceOperator.accessKey))
      .map((dt) => {
        serviceCategories.push(dt.serviceOperator.serviceCategory);
        return dt.serviceOperator.accessKey;
      });
    userData["servicesCategories"] = serviceCategories;
    userData["services"] = accessKeys;
  }
  return userData;
};
