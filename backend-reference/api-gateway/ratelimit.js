const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { client: redisClient } = require("./redisCacheDataMethods");

// Per-IP throttling at the edge for the unauthenticated auth endpoints only (F-GW-03).
// General authenticated traffic is intentionally left unthrottled here. The users service
// keeps its own per-account limiters; this is the per-IP layer in front of them.
// Limits are per 15 min per IP and sized to tolerate office NAT — tune with product/ops.
const WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMITS = [
    { path: "/api/v1/user/login", prefix: "login", limit: 30 },
    { path: "/api/v1/user/signUp", prefix: "signup", limit: 15 },
    { path: "/api/v1/user/otp", prefix: "otp", limit: 10 },
    { path: "/api/v1/user/verify-emailOtp", prefix: "verifyotp", limit: 20 },
    { path: "/api/v1/user/forgotPassword", prefix: "forgot", limit: 10 },
    { path: "/api/v1/user/resetPassword", prefix: "reset", limit: 10 },
];

const makeLimiter = ({ prefix, limit }) =>
    rateLimit({
        windowMs: WINDOW_MS,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        // Redis blip must not lock everyone out of login: allow the request if the store errors.
        passOnStoreError: true,
        store: new RedisStore({
            prefix: `rl:${prefix}:`,
            sendCommand: (...args) => redisClient.sendCommand(args),
        }),
        handler: (req, res) =>
            res.status(429).json({
                status: false,
                message: "Too many attempts. Please try again later.",
                data: {},
                responseCode: "429",
            }),
    });

const setupRateLimit = (app) => {
    AUTH_LIMITS.forEach((cfg) => app.use(cfg.path, makeLimiter(cfg)));
};

exports.setupRateLimit = setupRateLimit;
