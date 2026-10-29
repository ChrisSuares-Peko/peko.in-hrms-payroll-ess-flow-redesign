const ErrorResponse = require("./error-response");
const { customLog } = require("./loggerHelper");

/**
 * @typedef {'json' | 'redirect' | 'error'} ResponseType
 */

/**
 * @param {Object} params
 * @param {import('express').Response} params.res - Express Response object
 * @param {import('express').NextFunction} params.next - Express NextFunction
 * @param {ResponseType} [params.type='json'] - Type of response
 * @param {number} [params.statusCode=200] - HTTP status code
 * @param {boolean} [params.status=true] - Status flag
 * @param {string} [params.message='Success'] - Response message
 * @param {Object} [params.data={}] - Data payload
 * @param {string} [params.responseCode='000'] - Custom response code
 * @param {string} [params.redirectUrl=''] - Redirect URL (for type 'redirect')
 */
const GenericResponse = ({
  res,
  next,
  type = "json", // "json" | "redirect" | "error"
  statusCode = 200,
  status = true,
  message = "Success",
  data = {},
  responseCode = "000",
  redirectUrl = "",
}) => {
  customLog(null, "info", {
    message: "GenericResponse called",
    type,
    statusCode,
    status,
    responseCode,
    redirectUrl,
    data,
  }, "CONSOLE", ["token", "refreshToken", "sessionId"])
  switch (type) {
    case "redirect": {
      const url = `${redirectUrl}?status=${status}&message=${encodeURIComponent(
        message
      )}&data=${encodeURIComponent(
        JSON.stringify(data)
      )}&responseCode=${responseCode}`;
      customLog(null, "info", { message: "Redirecting to URL", url });
      return res.redirect(url);
    }

    case "error": {
      return next(new ErrorResponse(message, statusCode));
    }

    case "json":
    default: {
      return res.status(statusCode).json({
        status,
        message,
        data,
        responseCode,
      });
    }
  }
};

module.exports = GenericResponse;
