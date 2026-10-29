jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({ fetchServiceDetails: jest.fn() }));
jest.mock('../../../models/use-cases/setting', () => ({ getGstDetails: jest.fn() }));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../utils/walletTransaction', () => ({
    createWalletTransaction: jest.fn(),
    updateWalletTransaction: jest.fn(),
}));
jest.mock('../../../utils/paymentGatewayTransaction', () => ({ createPGTransaction: jest.fn() }));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateSubscriptionInvoiceAttachments: jest.fn() }));
jest.mock('../../../utils/corporateCardsClient', () => ({ recordPhysicalCardPurchase: jest.fn() }));
jest.mock('../../../utils/cacheDataMethods', () => ({ getValue: jest.fn() }));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const { fetchServiceDetails } = require('../../../utils/checkAndFetchServiceDetails');
const { getGstDetails } = require('../../../models/use-cases/setting');
const { createNotification } = require('../../../models/use-cases/notification');
const { updateWalletTransaction } = require('../../../utils/walletTransaction');
const { createPGTransaction } = require('../../../utils/paymentGatewayTransaction');
const emailer = require('../../../utils/emailer');
const { generateSubscriptionInvoiceAttachments } = require('../../../services/invoiceAndReceipt');
const { recordPhysicalCardPurchase } = require('../../../utils/corporateCardsClient');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { publishJournalEvent } = require('../../../utils/bull/queue/accountingEventsQueue');
const { payment, getPhysicalCardPricing } = require('../corporateCards');

const user = {
    id: 11, corporateId: 42, packageId: 5, username: 'admin', email: 'a@b.c', name: 'Acme', registeredBy: 1,
};

const response = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};

const pay = async (body = {}) => {
    const req = {
        user,
        LogTraceId: 't',
        body: {
            accessKey: 'corporate_cards',
            corporateTxnId: 1700000000000,
            quantity: 1,
            cardIssuanceId: '77',
            amount: 100,
            pgAmount: 118,
            paymentGatewayResponse: [{ payment_method: 'UPI' }],
            ...body,
        },
    };
    const res = response();
    const next = jest.fn();
    await payment(req, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    fetchServiceDetails.mockResolvedValue({ id: 9, unitPrice: '100.00', surcharge: '2', surchargeType: 'PERCENTAGE' });
    getGstDetails.mockResolvedValue({ details: { gst: '18', type: 'PERCENTAGE' } });
    createPGTransaction.mockResolvedValue({ orderId: 'ord-1', paymentMode: 'PG' });
    recordPhysicalCardPurchase.mockResolvedValue({ ok: true, data: { cardLast4: '4242' } });
    generateSubscriptionInvoiceAttachments.mockResolvedValue(['receipt.pdf', 'invoice.pdf']);
    computeJournalData.mockResolvedValue({ netSubscriptionIncome: 100, outputGSTonRevenue: 18 });
});

describe('corporateCards.payment — GST-exclusive physical card', () => {
    it('charges base + GST with no platform surcharge', async () => {
        const { res } = await pay();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(createPGTransaction).toHaveBeenCalledWith(expect.objectContaining({
            orderAmount: 100,
            surcharge: 0,
            pgAmount: 118,
        }));
    });

    it('stores the tax breakdown on the order', async () => {
        await pay();

        const { orderResponse } = updateWalletTransaction.mock.calls[0][0];
        expect(JSON.parse(orderResponse)).toEqual({
            quantity: 1,
            unitPrice: 100,
            taxableAmount: 100,
            taxAmount: 18,
            taxRate: 18,
            allocated: true,
            cardLast4: '4242',
        });
    });

    it('records the paid card with the gross amount', async () => {
        await pay();

        expect(recordPhysicalCardPurchase).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 118, unitPrice: 100, sourceCardIssuanceId: '77' }),
            expect.anything()
        );
    });

    it('sends the plan-style GST invoice with the email', async () => {
        await pay();

        expect(generateSubscriptionInvoiceAttachments).toHaveBeenCalledWith(expect.objectContaining({
            amount: 118,
            pgAmount: 118,
            orderId: 'ord-1',
            description: 'Physical Card',
            paymentMethod: 'UPI',
        }));
        const [, subject, body, attachments] = emailer.emailWithMultipleAttachment.mock.calls[0];
        expect(subject).toBe('Your Corporate Cards payment was successful');
        expect(body).toContain('₹118.00 (incl. GST)');
        expect(attachments).toEqual(['receipt.pdf', 'invoice.pdf']);
    });

    it('tells the admin the GST-inclusive total', async () => {
        await pay();

        expect(createNotification.mock.calls[0][0].notificationBrief)
            .toContain('₹118.00 (incl. GST)');
    });

    it('books the journal like a plan purchase: gross paid with no surcharge', async () => {
        await pay();

        expect(computeJournalData).toHaveBeenCalledWith(expect.objectContaining({
            pgAmount: 118,
            amount: 100,
            isSubscription: true,
        }));
        expect(publishJournalEvent).toHaveBeenCalledWith(
            expect.objectContaining({ transactionRef: 1700000000000, type: 'payment' }),
            't'
        );
    });

    it.each([
        ['the old GST-inclusive total', 100],
        ['the old base + surcharge total', 102],
    ])('refuses %s', async (_label, pgAmount) => {
        const { res, next } = await pay({ pgAmount });

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Amount mismatch' }));
        expect(createPGTransaction).not.toHaveBeenCalled();
        expect(recordPhysicalCardPurchase).not.toHaveBeenCalled();
    });

    it('refuses when the plan has no physical card price', async () => {
        fetchServiceDetails.mockResolvedValue({ unitPrice: null });

        const { next } = await pay();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Extra physical cards are not available on your plan.',
        }));
        expect(createPGTransaction).not.toHaveBeenCalled();
    });
});

describe('corporateCards.getPhysicalCardPricing', () => {
    const preview = async (query = {}) => {
        const res = response();
        const next = jest.fn();
        await getPhysicalCardPricing({ user, query, LogTraceId: 't' }, res, next);
        return { res, next };
    };

    it('returns the same numbers the payment enforces', async () => {
        const { res } = await preview();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0].data).toEqual({
            unitPrice: 100,
            quantity: 1,
            taxableAmount: 100,
            taxAmount: 18,
            taxRate: 18,
            expectedPaymentAmount: 118,
        });
    });

    it('prices the requested quantity', async () => {
        const { res } = await preview({ quantity: '2' });

        expect(res.json.mock.calls[0][0].data).toEqual(expect.objectContaining({
            quantity: 2,
            taxableAmount: 200,
            expectedPaymentAmount: 236,
        }));
    });

    it('refuses when the service is not on the plan', async () => {
        fetchServiceDetails.mockResolvedValue({ error: 'Unable to process your request' });

        const { res, next } = await preview();

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Apologies, the service you are trying to access is currently unavailable.',
        }));
    });
});
