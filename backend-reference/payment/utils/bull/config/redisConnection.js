const Redis = require("ioredis");
const { customLog } = require("../../loggerHelper");

const {
    REDIS_HOSTNAME = "127.0.0.1",
    REDIS_PORT = "6379",
    REDIS_PASSWORD,
    REDIS_USERNAME = "default",
} = process.env;

const isLocal =
    REDIS_HOSTNAME === "127.0.0.1" || REDIS_HOSTNAME === "localhost";

const buildOptions = (extra = {}) => ({
    host: REDIS_HOSTNAME,
    port: Number(REDIS_PORT),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: true,
    // Forces IPv4 — common fix for VPC connectivity
    family: 4,
    keepAlive: 30000,
    noDelay: true,
    connectTimeout: 10000,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    reconnectOnError: (err) =>
        /READONLY|ECONNRESET|ETIMEDOUT/.test(err?.message),
    ...(isLocal
        ? {}
        : {
              password: REDIS_PASSWORD,
              username: REDIS_USERNAME,
              tls: {
                  rejectUnauthorized: false,
                  // SNI is often required by VPC connectors to route traffic
                  servername: REDIS_HOSTNAME,
              },
          }),
    ...extra,
});

// Dropped-connection errors ioredis recovers from on its own (see
// retryStrategy/reconnectOnError above) — logged as info, not error.
// (customLog only supports "info"/"error" — "warn" is silently dropped.)
const isTransientNetError = (err) =>
    /ECONNRESET|ETIMEDOUT|EPIPE/.test(err?.message);

/**
 * Bull requires three connection types:
 *   - "client"     : commands
 *   - "subscriber" : blocking pop / pub-sub
 *   - "bclient"    : blocking commands
 * Each must be a NEW connection (do not share).
 */
exports.createBullClient = (role = "client") => {
    const client = new Redis(buildOptions());
    client.on("connect", () =>
        customLog(null, "info", { message: `[Redis:${role}] connected` })
    );
    client.on("error", (err) =>
        customLog(null, isTransientNetError(err) ? "info" : "error", {
            message: `[Redis:${role}] error`,
            err: err?.message,
        })
    );
    return client;
};
