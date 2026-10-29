jest.mock('../../../services/ondcObservability', () => ({
    reportInbound: jest.fn(),
    reportOutbound: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_order', () => ({
    updateOndcOrderStatus: jest.fn().mockResolvedValue([1]),
    updateOndcOrderTracking: jest.fn().mockResolvedValue([1]),
    findOndcOrderByTransactionId: jest.fn(),
}));
jest.mock('../../../services/ondcPayoutHold', () => ({
    recordDeliveryAndHoldPayout: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../services/ondcReturnLifecycle', () => ({
    applyOndcReturnOnUpdate: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../services/ondcInvoiceNotify', () => ({
    sendOndcInvoiceEmail: jest.fn().mockResolvedValue(undefined),
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

const {
    updateOndcOrderStatus,
    findOndcOrderByTransactionId,
} = require('../../../models/use-cases/ondc_order');
const { sendOndcInvoiceEmail } = require('../../../services/ondcInvoiceNotify');
const { onStatus } = require('../ondc');

const res = () => {
    const r = {};
    r.status = jest.fn(() => r);
    r.json = jest.fn(() => r);
    return r;
};

/** setImmediate-deferred work (the invoice + payout hooks) runs after the ACK. */
const flushDeferred = () => new Promise((resolve) => setImmediate(resolve));

/** asyncHandler swallows a throw into next() — rethrow so a broken handler fails loudly. */
const next = () => (err) => {
    throw err;
};

const DOCUMENTS = [{ url: 'https://seller-np.com/invoices/O1.pdf', label: 'Invoice' }];

const callback = (documents) => ({
    body: {
        context: { transaction_id: 'txn-1' },
        message: {
            order: {
                id: 'O1',
                state: 'Completed',
                fulfillments: [{ type: 'Delivery', state: { descriptor: { code: 'Order-delivered' } } }],
                ...(documents === undefined ? {} : { documents }),
            },
        },
    },
});

beforeEach(() => {
    jest.clearAllMocks();
    findOndcOrderByTransactionId.mockResolvedValue({ id: 7, orderId: 'O1', documents: DOCUMENTS });
});

describe('onStatus — invoice documents', () => {
    it('persists the documents block from the callback', async () => {
        await onStatus(callback(DOCUMENTS), res(), next());
        await flushDeferred();

        expect(updateOndcOrderStatus).toHaveBeenCalledWith(
            expect.objectContaining({ transactionId: 'txn-1', documents: DOCUMENTS })
        );
    });

    it('hands the persisted row to the invoice mailer', async () => {
        await onStatus(callback(DOCUMENTS), res(), next());
        await flushDeferred();

        expect(findOndcOrderByTransactionId).toHaveBeenCalledWith('txn-1');
        expect(sendOndcInvoiceEmail).toHaveBeenCalledWith(
            expect.objectContaining({ row: expect.objectContaining({ id: 7 }) })
        );
    });

    // The ordinary case — most status callbacks carry no paperwork and must cost no query.
    it('does not touch the invoice path when the callback carries no documents', async () => {
        await onStatus(callback(undefined), res(), next());
        await flushDeferred();

        expect(findOndcOrderByTransactionId).not.toHaveBeenCalled();
        expect(sendOndcInvoiceEmail).not.toHaveBeenCalled();
    });

    it('does not touch the invoice path for an empty documents array', async () => {
        await onStatus(callback([]), res(), next());
        await flushDeferred();

        expect(sendOndcInvoiceEmail).not.toHaveBeenCalled();
    });

    it('still ACKs when the invoice lookup throws', async () => {
        findOndcOrderByTransactionId.mockRejectedValue(new Error('db down'));
        const r = res();

        await onStatus(callback(DOCUMENTS), r, next());
        await flushDeferred();

        expect(r.status).toHaveBeenCalledWith(200);
    });
});
