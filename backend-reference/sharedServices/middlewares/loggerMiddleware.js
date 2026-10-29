const { v4: uuidv4 } = require("uuid");
const { customLog } = require("../utils/loggerHelper");

module.exports = function loggerMiddleware(req, res, next) {
  req.LogTraceId = uuidv4();

  const originalJson = res.json.bind(res);
  res.json = (data) => {
    res.loggerMessage = data?.message || res.statusMessage;
    return originalJson(data);
  };

  res.on("finish", () => {
    customLog(req.LogTraceId, "info", {
      message: "request_finished",
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      responseMessage: res.loggerMessage,
    });
  });

  next();
};
