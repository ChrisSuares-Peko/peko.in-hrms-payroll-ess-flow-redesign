const { customLog } = require("./loggerHelper");
const { default: axios } = require("axios");
const { getValue, setValue } = require("./cacheDataMethods");
const { fetchServiceDetails } = require("./checkAndFetchServiceDetails");
const ErrorResponse = require("./error-response");

const accessKey = "software_service";
async function getSessionId({ API_URL, api_key, req }) {
  const {
    email,
    mobile: phone,
    contactPersonName: name,
    id: userId,
  } = req.user;

  const ua = req.useragent || {};

  const deviceType = ua.isMobile
    ? "mobile"
    : ua.isTablet
      ? "tablet"
      : ua.browser
        ? "web"
        : "api";

  const platform =
    req.headers["sec-ch-ua-platform"]?.replace(/"/g, "") ||
    ua.platform ||
    ua.os ||
    "unknown";

  let redisKey = `${accessKey}-sessionId-${userId}`;
  let isTokenExist = await getValue(redisKey);

  if (isTokenExist) {
    return isTokenExist;
  } else {
    try {
      let payload = { email, phone, name, deviceType, platform };
      const config = {
        method: "POST",
        url: `${API_URL}/sessions`,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": api_key,
        },
        data: payload,
      };

      customLog(
        null,
        "info",
        {
          message: "software service - checking sessions api Request",
          request: config,
        },
        "VENDOR",
        [JSON.stringify(payload)],
      );

      const response = await axios(config);

      customLog(null, "info", {
        message: "software service - checking sessions api Response",
        response: response.data,
      });

      if (
        !response?.data?.data?.sessionId ||
        !response?.data?.data?.expiresAt
      ) {
        return null;
      }

      const { sessionId, expiresAt } = response.data.data;

      const ttlInSeconds = Math.max(
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
        1,
      );

      await setValue(redisKey, ttlInSeconds, sessionId);
      return sessionId;
    } catch (error) {
      customLog(null, "error", {
        message: "Error : software service - checking sessions api ",
        data: error?.response?.data || error,
      });
      return null;
    }
  }
}

async function checkPermission(req) {
  const {
    id: credentialId,
    packageId,
    corporateId: corporateUserId,
  } = req.user;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    throw new ErrorResponse(
      "Apologies, the service you are trying to access is currently unavailable.",
      400,
    );
  }

  const API_URL = serviceDetails.vendor.apiUrl;
  const api_key = serviceDetails.vendor.optional1;
  const serviceOperatorId = serviceDetails.id;

  const sessionId = await getSessionId({
    API_URL,
    api_key,
    req,
  });

  if (!sessionId) {
    throw new ErrorResponse(
      "Apologies, the service you are trying to access is currently unavailable.",
      400,
    );
  }

  return { API_URL, api_key, sessionId, serviceOperatorId, serviceDetails };
}

module.exports = {
  accessKey,
  checkPermission,
};
