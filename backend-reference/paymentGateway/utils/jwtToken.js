/* eslint-disable no-undef */
const {
  findOne: findOneCorporateUser,
} = require("./../models/use-cases/corporateUser");
const { findOneCredential } = require("./../models/use-cases/credential");
const wallet = require("../models/entities/wallet");
let serviceOperator = require("../models/entities/serviceOperator");
const disableServices = require("../models/entities/disabledService");
let cashback = require("../models/entities/cashback");
const { getValue } = require("./cacheDataMethods");

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
    let parsedUser = {};

    try {
      parsedUser = (await exports.resolveSessionUser(req)) || {};
    } catch (e) {
      console.warn("Invalid session, continuing without it.");
    }

    // If it's a sub-user, just attach and exit
    if (parsedUser?.role === "CORPORATE_SUB_USER") {
      req.user = parsedUser;
      return next();
    }
    if (req.url.includes("complete") || req.url.includes("callback")) {
      const corporateId = req.params.corporateId;

      // F-PG-01: this branch builds req.user from the :corporateId in the URL. It must only ever be the
      // caller's own id — otherwise any user could act as another corporate by adding "?complete" to a
      // URL. The frontend always calls these with its own id, so genuine requests are unaffected.
      if (!parsedUser || Object.keys(parsedUser).length === 0) {
        return res.status(401).json({
          status: false,
          message: "Session expired or invalid",
          data: {},
          responseCode: "002",
        });
      }
      if (String(parsedUser.id) !== String(corporateId)) {
        return res.status(403).json({
          status: false,
          message: "Unauthorized access.",
          data: {},
          responseCode: "001",
        });
      }

      let userDetails = await findOneCredential(
        {
          id: corporateId,
        },
        ["username", "name"]
      );
      let user = {
        id: corporateId,
      };
      req.user = user;
      const details = await findOneCorporateUser(
        {
          id: req.user.id,
        },
        [
          "packageId",
          "logo",
          "kycStatus",
          "isActive",
          "registeredBy",
          "email",
          "tradeLicenseExpiry",
          "city",
          "state",
          "id",
          "email",
          "mobileNo",
          "contactPersonName"
        ]
      );

      const walletDetails = await wallet.findOne({
        where: {
          credentialId: req.user.id,
        },
        attributes: ["balance"],
      });
      req.user["packageId"] = details ? details["packageId"] : 1;
      req.user["registeredBy"] = details ? details["registeredBy"] : 1;
      req.user["tradeLicenseExpiry"] = details
        ? details["tradeLicenseExpiry"]
        : "";
      req.user["balance"] =
        walletDetails && walletDetails["balance"]
          ? parseFloat(walletDetails["balance"]).toFixed(2)
          : 0.0;
      req.user["kycStatus"] =
        details && details["kycStatus"] ? details["kycStatus"] : "Pending";
      req.user["logo"] =
        details && details["logo"] ? details["logo"].toString() : "";
      req.user["email"] = details && details["email"] ? details["email"] : "";
      req.user["username"] =
        userDetails && userDetails["username"] ? userDetails["username"] : "";
      req.user["name"] =
        userDetails && userDetails["name"] ? userDetails["name"] : "";
      req.user["city"] = details && details["city"] ? details["city"] : "";
      req.user["state"] = details && details["state"] ? details["state"] : "";
      req.user["mobile"] =
        details && details["mobileNo"] ? details["mobileNo"] : "";
      req.user["email"] = details && details["email"] ? details["email"] : "";
      req.user["corporateId"] = details && details["id"] ? details["id"] : "";
      req.user["contactPersonName"] = details && details["contactPersonName"] ? details["contactPersonName"] : "";
      // eslint-disable-next-line no-constant-condition
      if (false && req.user["kycStatus"] != "approved") {
        return res.status(200).json({
          success: false,
          error: `Your Kyc Status is ${req.user["kycStatus"]}`,
        });
      } else {
        return next();
      }
    } else {
      if (!parsedUser || Object.keys(parsedUser).length === 0) {
        return res.status(401).json({
          status: false,
          message: "Session expired or invalid",
          data: {},
          responseCode: "002",
        });
      }
      req.user = parsedUser;
      next();
    }
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message,
      data: {},
      responseCode: err.message == "jwt expired" ? "002" : "001",
    });
  }
};

/**
 * system_user routes only. Role comes from gateway Redis session (userdata header).
 * Path :userId must match the session user id.
 */
exports.requireSystemUser = async (req, res, next) => {
  try {
    if (!req.user) {
      req.user = await exports.resolveSessionUser(req);
    }
    if (req.user?.role !== "SYSTEM_USER") {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access.",
        data: {},
        responseCode: "001",
      });
    }
    if (req.params.userId != null && String(req.params.userId) !== String(req.user.id)) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access.",
        data: {},
        responseCode: "001",
      });
    }
    return next();
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: err.message || "Unauthorized access.",
      data: {},
      responseCode: "001",
    });
  }
};

// adding req.user for webhooks
module.exports.findUserDetails = async function (userId) {
  let userDetails = await findOneCredential(
    {
      id: userId,
    },
    ["username", "name", "role"]
  );
  let userData = {};
  userData["id"] = userId;
  userData["username"] =
    userDetails && userDetails["username"] ? userDetails["username"] : "";
  userData["name"] =
    userDetails && userDetails["name"] ? userDetails["name"] : "";
  userData["role"] =
    userDetails && userDetails["role"] ? userDetails["role"] : "";
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
      "mobileNo",
      "contactPersonName",
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
  userData["mobileNo"] = details && details["mobileNo"] ? details["mobileNo"] : "";
  userData["contactPersonName"] = details && details["contactPersonName"] ? details["contactPersonName"] : "";

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
