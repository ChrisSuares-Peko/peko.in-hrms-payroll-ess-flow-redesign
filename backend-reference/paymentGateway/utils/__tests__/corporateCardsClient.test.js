jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const axios = require('axios');
const { customLog } = require('../loggerHelper');
const { recordPhysicalCardPurchase } = require('../corporateCardsClient');

const PAYLOAD = { paymentRefId: '1700000000000', corporateId: 42, quantity: 1 };

const httpError = (status) => Object.assign(new Error(`status ${status}`), {
    response: { status, data: { message: 'nope' } },
});
const networkError = () => Object.assign(new Error('timeout of 10000ms exceeded'), { response: undefined });

const call = () => recordPhysicalCardPurchase(PAYLOAD, { logTraceId: 't' });

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ doNotFake: ['nextTick'] });
    process.env.CARD_PURCHASE_CALLBACK_SECRET = 'shhh';
    process.env.PRODUCTION_URL = 'https://gateway.example';
    delete process.env.NODE_ENV;
});

afterEach(() => {
    jest.useRealTimers();
    delete process.env.CARD_PURCHASE_CALLBACK_SECRET;
    delete process.env.PRODUCTION_URL;
});

/** Drains the retry backoff without waiting on real time. */
const run = async () => {
    const promise = call();
    await jest.runAllTimersAsync();
    return promise;
};

describe('recording a paid physical card', () => {
    it('posts to corporateCard with the shared secret', async () => {
        axios.post.mockResolvedValue({ data: { data: { recorded: true } } });

        const result = await run();

        expect(axios.post).toHaveBeenCalledWith(
            'https://gateway.example/api/v1/webhook/paymentgateway/corporate-cards/physical-card-purchase',
            PAYLOAD,
            expect.objectContaining({ headers: expect.objectContaining({ 'x-card-purchase-secret': 'shhh' }) })
        );
        expect(result).toMatchObject({ ok: true });
    });

    it('does not retry a call that succeeded', async () => {
        axios.post.mockResolvedValue({ data: { data: {} } });

        await run();

        expect(axios.post).toHaveBeenCalledTimes(1);
    });
});

/**
 * The gap this retry exists for: corporateCard scaled to zero, so the first purchase after an idle
 * period meets a cold start. Without a retry the customer is charged and gets nothing.
 */
describe('a transient failure', () => {
    it.each([
        ['a network timeout', networkError()],
        ['a 502 from the gateway', httpError(502)],
        ['a 503 while corporateCard restarts', httpError(503)],
    ])('retries %s and succeeds on a later attempt', async (_label, error) => {
        axios.post.mockRejectedValueOnce(error).mockResolvedValue({ data: { data: {} } });

        const result = await run();

        expect(axios.post).toHaveBeenCalledTimes(2);
        expect(result).toMatchObject({ ok: true });
    });

    it('gives up after three attempts rather than retrying forever', async () => {
        axios.post.mockRejectedValue(networkError());

        const result = await run();

        expect(axios.post).toHaveBeenCalledTimes(3);
        expect(result).toMatchObject({ ok: false, reason: 'CALLBACK_FAILED' });
    });
});

/**
 * A 4xx is a decision, not a hiccup — a bad secret or a malformed body fails identically next time, and
 * hammering it just delays the admin's response.
 */
describe('a deterministic failure', () => {
    it.each([
        ['401 — wrong or missing secret', 401],
        ['400 — malformed payload', 400],
        ['403 — forbidden', 403],
    ])('does not retry %s', async (_label, status) => {
        axios.post.mockRejectedValue(httpError(status));

        const result = await run();

        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({ ok: false, status });
    });
});

describe('reporting', () => {
    it('logs the final failure at error level with the payment reference, so it can be alerted on', async () => {
        axios.post.mockRejectedValue(httpError(500));

        await run();

        expect(customLog).toHaveBeenCalledWith('t', 'error', expect.objectContaining({
            message: expect.stringContaining('the payment stands, the card was not allocated'),
            paymentRefId: '1700000000000',
            corporateId: 42,
        }));
    });

    // An intermediate failure that later succeeds must not page anyone.
    it('does not log an error when a retry recovers', async () => {
        axios.post.mockRejectedValueOnce(networkError()).mockResolvedValue({ data: { data: {} } });

        await run();

        const errorCalls = customLog.mock.calls.filter(([, level]) => level === 'error');
        expect(errorCalls).toHaveLength(0);
    });

    it('refuses without calling out when the secret is not configured', async () => {
        delete process.env.CARD_PURCHASE_CALLBACK_SECRET;

        const result = await run();

        expect(axios.post).not.toHaveBeenCalled();
        expect(result).toMatchObject({ ok: false, reason: 'NOT_CONFIGURED' });
    });
});
