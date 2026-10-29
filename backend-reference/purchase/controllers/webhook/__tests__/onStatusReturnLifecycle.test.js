jest.mock('../../../services/ondcObservability', () => ({
    reportInbound: jest.fn(),
    reportOutbound: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_order', () => ({
    updateOndcOrderStatus: jest.fn().mockResolvedValue([1]),
    updateOndcOrderTracking: jest.fn().mockResolvedValue([1]),
}));
jest.mock('../../../services/ondcPayoutHold', () => ({
    recordDeliveryAndHoldPayout: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../services/ondcReturnLifecycle', () => ({
    applyOndcReturnOnUpdate: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../services/ondcStatusWaiter', () => ({ notifyOnStatus: jest.fn() }));
// Only reached by onConfirm, but requiring it drags in models/use-cases/subscription.js,
// which babel can't parse (it uses the reserved word `package`) — that would fail the
// suite at import time, before any of these tests ran.
jest.mock('../../../services/ondcOnConfirmPersist', () => ({
    persistAndSettleFromOnConfirm: jest.fn(),
}));
// Must resolve, not return undefined — logCallback chains .catch() on it.
jest.mock('../../../models/use-cases/ondc_callback_log', () => ({
    createCallbackLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const { applyOndcReturnOnUpdate } = require('../../../services/ondcReturnLifecycle');
const { updateOndcOrderStatus } = require('../../../models/use-cases/ondc_order');
const { onStatus } = require('../ondc');

const res = () => {
    const r = {};
    r.status = jest.fn(() => r);
    r.json = jest.fn(() => r);
    return r;
};

/** setImmediate-deferred work (the return + payout hooks) runs after the ACK. */
const flushDeferred = () => new Promise((resolve) => setImmediate(resolve));

/**
 * asyncHandler swallows a throw into next(), so a plain jest.fn() next would turn a
 * broken handler into a silently-passing test. Rethrow instead.
 */
const next = () => (err) => {
    throw err;
};

const callback = (fulfillments) => ({
    body: {
        context: { transaction_id: 'txn-1' },
        message: { order: { id: 'ONDC-1', state: 'Completed', fulfillments } },
    },
});

const DELIVERY_LEG = { type: 'Delivery', state: { descriptor: { code: 'Order-delivered' } } };
const RETURN_LEG = { id: 'R1', type: 'Return', state: { descriptor: { code: 'Return_Picked' } } };

beforeEach(() => jest.clearAllMocks());

describe('onStatus — return lifecycle routing', () => {
    // Without this, a return only ever advanced on a seller-volunteered on_update: the
    // scheduler could poll a returning order forever and returnStatus never moved.
    it('feeds a Return leg into the same lifecycle an on_update would', async () => {
        await onStatus(callback([DELIVERY_LEG, RETURN_LEG]), res(), next());
        await flushDeferred();

        expect(applyOndcReturnOnUpdate).toHaveBeenCalledTimes(1);
        expect(applyOndcReturnOnUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ transactionId: 'txn-1' })
        );
    });

    it('leaves a plain delivery status out of the return path entirely', async () => {
        await onStatus(callback([DELIVERY_LEG]), res(), next());
        await flushDeferred();

        expect(updateOndcOrderStatus).toHaveBeenCalled();
        expect(applyOndcReturnOnUpdate).not.toHaveBeenCalled();
    });

    it('does not enter the return path when the callback carries no fulfillments', async () => {
        await onStatus(callback(undefined), res(), next());
        await flushDeferred();

        expect(applyOndcReturnOnUpdate).not.toHaveBeenCalled();
    });

    // A NACK carries no order — it must not be read as a return update.
    it('ignores an error callback', async () => {
        const req = callback([RETURN_LEG]);
        req.body.error = { code: '30001', message: 'nope' };

        await onStatus(req, res(), next());
        await flushDeferred();

        expect(updateOndcOrderStatus).not.toHaveBeenCalled();
        expect(applyOndcReturnOnUpdate).not.toHaveBeenCalled();
    });

    // Fire-and-forget: the ONDC ACK must not wait on a lifecycle step that can reach
    // Cashfree, and a failure there must not take the callback down.
    it('still ACKs when the return lifecycle throws', async () => {
        applyOndcReturnOnUpdate.mockRejectedValueOnce(new Error('cashfree down'));
        const r = res();

        await onStatus(callback([RETURN_LEG]), r, next());
        await flushDeferred();

        expect(r.status).toHaveBeenCalledWith(200);
    });
});
