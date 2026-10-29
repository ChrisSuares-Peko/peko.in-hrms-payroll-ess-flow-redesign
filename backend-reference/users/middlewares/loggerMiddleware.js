const logger = require("./../utils/logger");

// Request bodies carry passwords, OTPs, reset/refresh tokens, client secrets and tax ids, and this log is
// shipped to third-party sinks — mask any key that looks like one, at any depth.
const SENSITIVE_KEY = /pass(word)?|otp|token|secret|verifier|authorization|pan(number)?$|^pan|gst|^cin|totp|^file$|^image$|base64/i;
const REDACTED = "***";

const redact = (value, depth = 0) => {
  if (value === null || typeof value !== "object" || depth > 6) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.keys(value).reduce((acc, key) => {
    acc[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(value[key], depth + 1);
    return acc;
  }, {});
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
        ...(req.method !== "GET" ? { reqBody: redact({ ...req.body }) } : {}),
        pathParams: { ...req.params },
        queryParams: redact({ ...req.query }),
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
