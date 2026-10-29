const ErrorResponse = require("./error-response");
const { customLog } = require("./loggerHelper");

/**
 * Uniform rejection for the OIDC IdP endpoints.
 *
 * Every failed check used to answer with its own message — "Invalid client" vs "Invalid
 * redirect_uri" vs "invalid_code_verifier" vs "User not found" — which turns the endpoints into an
 * oracle: a caller probing values learns exactly which one it got right and how far into the flow
 * it reached. Collapsing them to one message per class removes that signal while the precise
 * reason still goes to the logs, keyed by the request's LogTraceId so support can correlate a
 * report to the real cause.
 *
 * `reason` is a stable machine tag, not prose — it is what you grep for in the logs.
 */
const idpFail = (
  req,
  next,
  { reason, status = 400, message = "Invalid request", details = {} }
) => {
  customLog(req?.LogTraceId, "error", {
    msg: "IdP request rejected",
    reason,
    status,
    path: req?.originalUrl,
    ...details,
  });
  return next(new ErrorResponse(message, status));
};

module.exports = { idpFail };
