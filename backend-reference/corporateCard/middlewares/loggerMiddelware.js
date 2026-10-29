const logger = require("./../utils/logger");

const MAX_LOGGED_STRING_LENGTH = 2048;

// F-CC-16: request-body keys redacted from logs (KYB / agreement / card PII).
const SENSITIVE_KEYS = new Set([
  "pan", "aadhaar", "aadhaarnumber", "aadharnumber", "gstin", "mobile", "mobilenumber", "phone",
  "email", "accountnumber", "ifsc", "cvv", "cardnumber", "maskedcardnumber", "customersignature",
  "password", "dob", "dateofbirth",
]);

const redactLargeValues = (value, depth = 0) => {
  if (typeof value === "string") {
    return value.length > MAX_LOGGED_STRING_LENGTH ? `[${value.length} chars omitted]` : value;
  }
  if (depth >= 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redactLargeValues(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) =>
      SENSITIVE_KEYS.has(String(key).toLowerCase())
        ? [key, "[redacted]"]
        : [key, redactLargeValues(item, depth + 1)]
    )
  );
};

const createLog = (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      return true;
    }

    const logLevel = res.statusCode >= 500 ? "error" : "info";

    return logger[logLevel]({
      request: {
        httpMethod: req.method,
        reqURL: req.originalUrl,
        ...(req.method !== "GET" ? { reqBody: redactLargeValues(req.body) } : {}),
        pathParams: { ...req.params },
        queryParams: { ...req.query },
        clientIpAddress:
          req.headers["x-forwarded-for"] ||
          req.connection?.remoteAddress ||
          req?.ips,
        deviceInfo: req.headers["user-agent"],
        ...(req.headers.authorization ? { jwtToken: true } : {}),
        ...(req.sessionId ? { sessionId: true } : {}),
      },
      response: {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
      },
    });
  } catch (e) {
    return logger.error(e, { req });
  }
};

module.exports = createLog;
