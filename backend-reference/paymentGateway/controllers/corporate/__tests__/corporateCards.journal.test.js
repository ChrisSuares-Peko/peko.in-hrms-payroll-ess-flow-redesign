jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({
    fetchServiceDetails: jest.fn(),
    calculateSurchargeWithTax: jest.fn(),
}));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../utils/walletTransaction', () => ({
    createWalletTransaction: jest.fn(),
    updateWalletTransaction: jest.fn(),
}));
jest.mock('../../../utils/paymentGatewayTransaction', () => ({ createPGTransaction: jest.fn() }));
jest.mock('../../../utils/emailer', () => ({}));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateSubscriptionInvoiceAttachments: jest.fn() }));
jest.mock('../../../utils/corporateCardsClient', () => ({ recordPhysicalCardPurchase: jest.fn() }));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction } = require('../../../utils/walletTransaction');
const { createPGTransaction } = require('../../../utils/paymentGatewayTransaction');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { payment } = require('../corporateCards');

const request = body => ({
    LogTraceId: 'trace-1',
    user: { id: 1, corporateId: 2, packageId: 3, registeredBy: 9, state: 'Kerala', role: 'CORPORATE_USER' },
    body: { corporateTxnId: 'TXN-1', quantity: 1, pgAmount: 290, ...body },
});

beforeEach(() => {
    jest.clearAllMocks();
    fetchServiceDetails.mockResolvedValue({ id: 5, unitPrice: 290, surcharge: 0, surchargeType: 'FLAT' });
    calculateSurchargeWithTax.mockResolvedValue({ surcharge: 0 });
    fetchPartnerDetails.mockResolvedValue({ sharePercentage: 0, state: 'Kerala' });
    computeJournalData.mockResolvedValue({ journalData: {} });
    // The journal is worked out before the order is saved; stopping here keeps the test to that step.
    createPGTransaction.mockResolvedValue({ error: 'stop here' });
    createWalletTransaction.mockResolvedValue({ error: 'stop here' });
});

describe('the journal of a physical card purchase', () => {
    it('is worked out as a physical card sale, on its own and not as a subscription', async () => {
        const next = jest.fn();

        await payment(request({ paymentGatewayResponse: [{ paymentGatewayName: 'Cashfree' }] }), {}, next);

        expect(computeJournalData).toHaveBeenCalledTimes(1);
        expect(computeJournalData).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 290,
                pgAmount: 290,
                isPhysicalCard: true,
                corporateState: 'Kerala',
            })
        );
        expect(computeJournalData.mock.calls[0][0]).not.toHaveProperty('billingType');
        expect(computeJournalData.mock.calls[0][0]).not.toHaveProperty('isSubscription');
    });

    it('is worked out the same way when the card is paid from the wallet', async () => {
        await payment(request({}), {}, jest.fn());

        expect(computeJournalData).toHaveBeenCalledWith(
            expect.objectContaining({ pgAmount: 0, isPhysicalCard: true })
        );
    });
});
