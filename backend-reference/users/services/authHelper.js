const { setValue, getValue, scanKeys, getTtl } = require("../utils/cacheDataMethods");
const { customLog } = require("../utils/loggerHelper");
const {
  findOne: findOneCorporateUser,
} = require("../models/use-cases/corporateUser");
const { findOneByCredentialId: findOneUser } = require("../models/use-cases/user");
const corporateUserEntity = require("../models/entities/corporateUser");
const { findByCorporateUserId } = require("../models/use-cases/access_codes");
const wallet = require("../models/entities/wallet");
const { findOneSubCorporateByCredentialId } = require("../models/use-cases/subCorporateUser");
const { findOneCredential } = require("../models/use-cases/credential");
const { findRole } = require("../models/use-cases/systemUser");

const expiryCalculationFn = (expiry) => {
  const match = expiry.match(/^(\d+)([smhd])$/); // Regex to extract value and unit
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10); // Numeric part
  const unit = match[2]; // Unit part (s, m, h, d)

  // Convert to seconds
  switch (unit) {
    case 's': return value; // seconds
    case 'm': return value * 60; // minutes
    case 'h': return value * 60 * 60; // hours
    case 'd': return value * 60 * 60 * 24; // days
    default: throw new Error(`Unsupported time unit: ${unit}`);
  }
};

exports.setSessionTokens = async (userId, sessionId, token, refreshToken, sessionData, isMobile, isAutoLogin) => {
  const accessTokenExpiry = isAutoLogin ? process.env.AUTO_LOGIN_ACCESS_TOKEN_EXPIRY :
    isMobile ? (process.env.MOBILE_ACCESS_TOKEN_EXPIRY || process.env.ACCESS_TOKEN_EXPIRY) :
      process.env.ACCESS_TOKEN_EXPIRY;

  const refreshTokenExpiry = isAutoLogin ? process.env.AUTO_LOGIN_REFRESH_TOKEN_EXPIRY :
    isMobile ? (process.env.MOBILE_REFRESH_TOKEN_EXPIRY || process.env.REFRESH_TOKEN_EXPIRY) :
      process.env.REFRESH_TOKEN_EXPIRY;

  await setValue(`token_${userId}_${sessionId}`, expiryCalculationFn(accessTokenExpiry), token);
  await setValue(`refreshToken_${userId}_${sessionId}`, expiryCalculationFn(refreshTokenExpiry), refreshToken);
  await setValue(`userData_${userId}_${sessionId}`, expiryCalculationFn(accessTokenExpiry), JSON.stringify(sessionData));
};

const TTL_KEY_GONE = -2;
const TTL_NO_EXPIRY = -1;

const sameServiceLabel = (a, b) =>
  typeof a === "string" && typeof b === "string"
  && a.trim().toLowerCase() === b.trim().toLowerCase();

exports.revokeSessionService = async (credentialId, label) => {
  if (!credentialId || !label) return 0;

  const keys = await scanKeys(`userData_${credentialId}_*`);
  let revoked = 0;

  for (const key of keys) {
    const raw = await getValue(key);
    if (!raw) continue;

    let sessionData;
    try {
      sessionData = JSON.parse(raw);
    } catch {
      continue;
    }

    const memberships = Array.isArray(sessionData?.serviceMemberships)
      ? sessionData.serviceMemberships
      : [];
    const index = memberships.findIndex((entry) => sameServiceLabel(entry?.label, label));
    if (index < 0) continue;

    const ttl = await getTtl(key);
    if (ttl === TTL_KEY_GONE) continue;

    const patched = memberships.map((entry, i) => (i === index
      ? { ...entry, hasAccess: false, status: "INACTIVE" }
      : entry));

    await setValue(
      key,
      ttl === TTL_NO_EXPIRY ? 0 : ttl,
      JSON.stringify({ ...sessionData, serviceMemberships: patched })
    );
    revoked += 1;
  }

  return revoked;
};

exports.checkPartnerAccess = async (partnerId, credentialPartnerId, loginUserDetails) => {
  const statusUpdate = {
    midPending: false,
    isSuccess: false
  };

  if (!credentialPartnerId || !partnerId) {
    return {
      midPending: false,
      isSuccess: true
    };
  }

  if (partnerId !== credentialPartnerId) {
    return statusUpdate;
  }

  if (loginUserDetails?.role === 'CORPORATE') {
    const corporateUser = await findOneCorporateUser({ id: loginUserDetails.id }, ['id']);
    if (!corporateUser) {
      return statusUpdate;
    }

    const accessCodeData = await findByCorporateUserId(corporateUser.id);

    if (!accessCodeData || accessCodeData.partnerId !== partnerId) {
      return {
        midPending: true,
        isSuccess: true
      };
    } else {
      return {
        midPending: false,
        isSuccess: true
      };
    }
  } else {
    return {
      midPending: false,
      isSuccess: true
    };
  }
};

exports.getAccessDetails = async (loginUserDetails, partnerId) => {
  let role = loginUserDetails.role;
  let roleName;
  let corporateUserId;
  let walletDetails = null;
  let subCorporateData = null;
  let userProfileDetails;
  let essProfile = null;
  let midPending = false;

  if (role === "CORPORATE") {
    userProfileDetails = await findOneCorporateUser({ id: loginUserDetails.id });

    walletDetails = await wallet.findOne({
      where: { credentialId: loginUserDetails.id },
      attributes: ["balance"],
    });

    corporateUserId = userProfileDetails?.id;
    roleName = "corporate";

    if (userProfileDetails.isActive === 0) {
      throw new Error("Account Inactive - Contact administrator for assistance");
    }

  } else if (role === "CORPORATE_SUB_USER") {
    subCorporateData = await findOneSubCorporateByCredentialId({ id: loginUserDetails.id });

    if (!subCorporateData || subCorporateData.isDeleted) {
      throw new Error("Account Not Found - Contact administrator for assistance.");
    }
    if (subCorporateData.status === "INACTIVE") {
      throw new Error("Account Inactive - Contact administrator for assistance.");
    }
    if (subCorporateData.services.length <= 0) {
      throw new Error("No services are available - Contact administrator for assistance.");
    }

    userProfileDetails = await findOneCorporateUser({ id: subCorporateData.corporateCredentialID });
    loginUserDetails = await findOneCredential({ id: subCorporateData.corporateCredentialID });

    loginUserDetails.role = "CORPORATE";
    loginUserDetails.roleName = "corporate sub user";
    loginUserDetails.subCorporateId = subCorporateData.id;

    role = "CORPORATE";
    roleName = "corporate sub user";
    corporateUserId = userProfileDetails?.id;

    if (userProfileDetails.status === 0) {
      throw new Error("Account is currently inactive");
    }
  } else if (role === "SYSTEM_USER") {
    userProfileDetails = await findOneCredential({ id: loginUserDetails.id });
    const roleData = await findRole(loginUserDetails?.id);
    if (roleData?.roleAndPermission?.dataValues?.status === 0 || roleData?.dataValues?.isActive === false) {
      throw new Error("Your account is currently disabled. Please contact support for assistance.");
    }
    roleName = roleData?.roleAndPermission?.roleName;
  } else if (role === "USER") {
    essProfile = await findOneUser(loginUserDetails.id);
    userProfileDetails = essProfile;

    if (!essProfile || essProfile.isActive === false || essProfile.isActive === 0) {
      throw new Error("Your account access has been revoked. Please contact your company administrator for further assistance.");
    }

    // a USER belongs to a corporate -> expose the parent corporate id
    corporateUserId = essProfile.corporateUserId;
    roleName = "employee";

    // Gate payroll/ESS access by the parent corporate's essAccess switch.
    const parentCorporate = corporateUserId
      ? await corporateUserEntity.findOne({
        where: { id: corporateUserId },
        attributes: ["essAccess"],
      })
      : null;
    if (parentCorporate && parentCorporate.essAccess === false) {
      throw new Error("Your company's Employee Self-Service portal access has been disabled. Please contact your company administrator.");
    }
  }

  // Check for mid mapping status
  if (loginUserDetails.role === 'CORPORATE' && corporateUserId) {
    const accessCodeData = await findByCorporateUserId(corporateUserId);
    if (!accessCodeData || accessCodeData?.partnerId !== partnerId) {
      midPending = true;
    }
  }

  return {
    loginUserDetails,
    userProfileDetails,
    walletDetails,
    role,
    roleName,
    corporateUserId,
    subCorporateData,
    essProfile,
    midPending
  };
};

exports.sendUnauthorized = (res, msg) => res.status(401).json({ status: false, message: msg, data: {}, responseCode: "001" });
exports.sendBadRequest = (res, msg) => res.status(400).json({ status: false, message: msg, data: {}, responseCode: "001" });

exports.logAndSendError = (req, res, err) => {
  customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });
  return res.status(500).json({ status: false, message: err.message, data: {}, responseCode: "001" });
};
