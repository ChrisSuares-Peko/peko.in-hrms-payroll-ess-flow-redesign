const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

function RateLimiter({
  windowMs = 10 * 60 * 1000,
  max = 5,
  message = "Too many requests. Please try again later.",
  keyBy = "ip",
  status = 429,
} = {}) {
  return rateLimit({
    windowMs,
    max,
    message,
    keyGenerator: (req) => {
      if (keyBy === "body_username" && req.body?.username) {
        return String(req.body.username).toLowerCase().trim();
      }
      if (keyBy === "body_mobile" && req.body?.mobileNo) {
        return String(req.body.mobileNo).trim();
      }
      if (keyBy === "body_email" && req.body?.email) {
        return String(req.body.email).toLowerCase().trim();
      }
      if (keyBy === "otp_login" && req.body?.email) {
        return `${req.body.partnerId ?? "none"}:${String(req.body.email).toLowerCase().trim()}`;
      }
      if (keyBy === "session" && req.headers.sessionid) {
        return req.headers.sessionid;
      }
      if (keyBy === "email" && req.user?.email) {
        return req.user.email.toLowerCase().trim();
      }
      if (keyBy === "partner_transaction_id" && req.body?.partner_transaction_id) {
        return req.body.partner_transaction_id.trim();
      }
      return ipKeyGenerator(req);
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      return res.status(status || options.statusCode || 500).json({
        status: false,
        message: message || "Server Error",
        data: {},
        responseCode: "001",
      });
    },
  });
}

const otpRateLimiter = (keyBy = "session", status = 429) => {
  return [
    RateLimiter({
      keyBy,
      max: 2,
      windowMs: 2 * 60 * 1000,
      status,
      message: "Too many OTP requests. Please try again in 2 minutes.",
    }),
    RateLimiter({
      keyBy,
      max: 10,
      windowMs: 24 * 60 * 60 * 1000,
      status,
      message: "You have reached the daily request limit. Please try again tomorrow.",
    }),
  ];
};

const otpVerifyRateLimiter = (keyBy = "body_email", status = 429) => {
  return RateLimiter({
    keyBy,
    max: 5,
    windowMs: 10 * 60 * 1000,
    status,
    message: "Too many attempts. Please request a new code and try again later.",
  });
};

const otpLoginRequestRateLimiter = (status = 429) => [
  ...otpRateLimiter("otp_login", status),
  RateLimiter({
    keyBy: "ip",
    max: 20,
    windowMs: 60 * 60 * 1000,
    status,
    message: "Too many login code requests from this network. Please try again later.",
  }),
];

function generalDailyRateLimiter(keyBy = "session") {
  return RateLimiter({
    keyBy,
    max: 10,
    windowMs: 24 * 60 * 60 * 1000,
    message: "You have reached the daily request limit. Please try again tomorrow.",
  });
}

module.exports = {
  RateLimiter,
  otpRateLimiter,
  otpLoginRequestRateLimiter,
  otpVerifyRateLimiter,
  generalDailyRateLimiter,
};
