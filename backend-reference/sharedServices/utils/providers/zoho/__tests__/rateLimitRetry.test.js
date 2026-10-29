// Real wait intervals default to 60s/30min — override them to a few ms before the module
// loads so these tests don't actually sleep.
process.env.ZOHO_RATE_LIMIT_POLL_INTERVAL_MS = "1";
process.env.ZOHO_DAILY_LIMIT_POLL_INTERVAL_MS = "1";
process.env.ZOHO_TRANSIENT_RETRY_DELAY_MS = "1";
process.env.ZOHO_TRANSIENT_RETRY_LIMIT = "2";

jest.mock("../auth", () => ({ refreshZohoAccessToken: jest.fn() }));

const { refreshZohoAccessToken } = require("../auth");
const { callWithZohoRateLimitRetry, callWithZohoTransientRetry } = require("../rateLimitRetry");

const httpError = (status, data) => ({ response: { status, data } });

describe("callWithZohoRateLimitRetry", () => {
    beforeEach(() => jest.clearAllMocks());

    it("waits and retries on a 429 with one of the documented codes", async () => {
        const fn = jest
            .fn()
            .mockRejectedValueOnce(httpError(429, { code: 44, message: "per-minute limit" }))
            .mockResolvedValueOnce("ok");

        await expect(callWithZohoRateLimitRetry(fn)).resolves.toBe("ok");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("also waits and retries on a 429 with an unrecognized or missing code", async () => {
        const fn = jest
            .fn()
            .mockRejectedValueOnce(httpError(429, { code: 9999, message: "unknown throttle" }))
            .mockRejectedValueOnce(httpError(429, undefined))
            .mockResolvedValueOnce("ok");

        await expect(callWithZohoRateLimitRetry(fn)).resolves.toBe("ok");
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("refreshes the token once on a 401 and lets the caller retry with it", async () => {
        refreshZohoAccessToken.mockResolvedValue("fresh-token");
        const fn = jest
            .fn()
            .mockRejectedValueOnce(httpError(401, { message: "invalid oauth token" }))
            .mockResolvedValueOnce("ok");
        const onTokenRefreshed = jest.fn();

        await expect(callWithZohoRateLimitRetry(fn, {}, onTokenRefreshed)).resolves.toBe("ok");
        expect(refreshZohoAccessToken).toHaveBeenCalledTimes(1);
        expect(onTokenRefreshed).toHaveBeenCalledWith("fresh-token");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("only retries a 401 once — a second 401 after the refreshed token still fails", async () => {
        refreshZohoAccessToken.mockResolvedValue("fresh-token");
        const error = httpError(401, { message: "invalid oauth token" });
        const fn = jest.fn().mockRejectedValue(error);
        const onTokenRefreshed = jest.fn();

        await expect(callWithZohoRateLimitRetry(fn, {}, onTokenRefreshed)).rejects.toBe(error);
        expect(refreshZohoAccessToken).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("does not attempt a token refresh when the caller gave no onTokenRefreshed callback", async () => {
        const error = httpError(401, { message: "invalid oauth token" });
        const fn = jest.fn().mockRejectedValue(error);

        await expect(callWithZohoRateLimitRetry(fn)).rejects.toBe(error);
        expect(refreshZohoAccessToken).not.toHaveBeenCalled();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries a transient (5xx / no-response) error up to the configured limit, then throws", async () => {
        const error = httpError(503, {});
        const fn = jest.fn().mockRejectedValue(error);

        await expect(callWithZohoRateLimitRetry(fn)).rejects.toBe(error);
        // Initial attempt + 2 retries (ZOHO_TRANSIENT_RETRY_LIMIT=2 above).
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("throws immediately on a non-retryable error", async () => {
        const error = httpError(400, { message: "bad request" });
        const fn = jest.fn().mockRejectedValue(error);

        await expect(callWithZohoRateLimitRetry(fn)).rejects.toBe(error);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe("callWithZohoTransientRetry", () => {
    beforeEach(() => jest.clearAllMocks());

    it("fails fast on a 429 without waiting, even with an unrecognized code", async () => {
        const error = httpError(429, { code: 9999 });
        const fn = jest.fn().mockRejectedValue(error);

        await expect(callWithZohoTransientRetry(fn)).rejects.toBe(error);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("refreshes the token once on a 401 and retries", async () => {
        refreshZohoAccessToken.mockResolvedValue("fresh-token");
        const fn = jest
            .fn()
            .mockRejectedValueOnce(httpError(401, {}))
            .mockResolvedValueOnce("ok");
        const onTokenRefreshed = jest.fn();

        await expect(callWithZohoTransientRetry(fn, {}, onTokenRefreshed)).resolves.toBe("ok");
        expect(onTokenRefreshed).toHaveBeenCalledWith("fresh-token");
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
