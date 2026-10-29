const logger = require("./../utils/logger");

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
        ...(req.method !== "GET" ? { reqBody: { ...req.body } } : {}),
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
