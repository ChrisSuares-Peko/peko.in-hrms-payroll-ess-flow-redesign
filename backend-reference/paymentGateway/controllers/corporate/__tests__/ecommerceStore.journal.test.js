jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../utils/emailSender', () => ({ paymentGateWayRefundFailureEmail: jest.fn() }));
jest.mock('../../../utils/emailer', () => ({}));
jest.mock('../../../utils/cashfreeGateway', () => ({ refundCashfreeDirect: jest.fn() }));
jest.mock('../../../utils/formatter', () => ({ formatNumberWithLocalString: jest.fn(value => String(value)) }));
jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({
    fetchServiceDetails: jest.fn(),
    calculateSurcharge: jest.fn(),
    calculateAmountWithTax: jest.fn(),
}));
jest.mock('../../../services/CleverTap', () => ({ uploadEvent: jest.fn() }));
jest.mock('../../../utils/ecommerceStoreSubscription', () => ({
    createEcommerceStoreSubscription: jest.fn(),
}));
jest.mock('../../../utils/upgradeCredit', () => ({ computeUpgradeCredit: jest.fn() }));
jest.mock('../expense', () => ({ createExpense: jest.fn() }));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateSubscriptionInvoiceAttachments: jest.fn() }));
jest.mock('../../../utils/emailTemplates/ecommerceStore', () => ({ generateEcommerceStorePaymentSuccessEmail: jest.fn() }));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));
jest.mock('../../../models/use-cases/package', () => ({ findOne: jest.fn() }));
jest.mock('../../../models/use-cases/serviceSubscription', () => ({ findActiveByAccessCode: jest.fn() }));

const {
    fetchServiceDetails,
    calculateSurcharge,
    calculateAmountWithTax,
} = require('../../../utils/checkAndFetchServiceDetails');
const { createEcommerceStoreSubscription } = require('../../../utils/ecommerceStoreSubscription');
const { computeUpgradeCredit } = require('../../../utils/upgradeCredit');
const { refundCashfreeDirect } = require('../../../utils/cashfreeGateway');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { findOne: findPackage } = require('../../../models/use-cases/package');
const { findActiveByAccessCode } = require('../../../models/use-cases/serviceSubscription');
const { payment } = require('../ecommerceStore');

const request = body => ({
    LogTraceId: 'trace-1',
    user: { id: 1, corporateId: 2, packageId: 3, registeredBy: 9, state: 'Kerala', email: 'a@b.c', name: 'Acme' },
    body: {
        paymentRefId: 'TXN-1',
        packageId: 40,
        pgAmount: 1499,
        amount: 1499,
        subscriptionPlan: 'growth',
        subscriptionDuration: 'annually',
        paymentGatewayResponse: [{ paymentGatewayName: 'Cashfree', payment_method: 'upi' }],
        ...body,
    },
});

const response = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

beforeEach(() => {
    jest.clearAllMocks();
    fetchPartnerDetails.mockResolvedValue({ sharePercentage: 0, state: 'Kerala' });
    fetchServiceDetails.mockResolvedValue({ id: 5, surcharge: 0, surchargeType: 'FLAT', vendor: { vendorName: 'Peko Ecom' } });
    calculateSurcharge.mockReturnValue(0);
    calculateAmountWithTax.mockResolvedValue(0);
    findPackage.mockResolvedValue({
        packageName: 'Growth',
        packagePrices: { monthly: 149, annually: 1499 },
        commissionMode: 'MARGIN',
        commissionType: 'PERCENTAGE',
        commission: 0,
    });
    findActiveByAccessCode.mockResolvedValue(null);
    computeUpgradeCredit.mockReturnValue(0);
    computeJournalData.mockResolvedValue({ journalData: {} });
    refundCashfreeDirect.mockResolvedValue({ status: true });
    // The journal is worked out before the subscription is saved; stopping here keeps the test to that step.
    createEcommerceStoreSubscription.mockResolvedValue({ error: 'stop here' });
});

describe("the journal of a Peko Commerce purchase", () => {
    it("is worked out as Peko's own subscription on the cycle that was bought", async () => {
        await payment(request({}), response(), jest.fn());

        expect(computeJournalData).toHaveBeenCalledTimes(1);
        expect(computeJournalData).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 1499,
                pgAmount: 1499,
                isSubscription: true,
                billingType: 'ANNUALLY',
                corporateState: 'Kerala',
                planDetails: expect.any(Array),
            })
        );
        expect(computeJournalData.mock.calls[0][0]).not.toHaveProperty('isPhysicalCard');
    });

    it('books a monthly plan on a monthly cycle, however the duration was spelt', async () => {
        await payment(request({ subscriptionDuration: 'Monthly', pgAmount: 149, amount: 149 }), response(), jest.fn());

        expect(computeJournalData).toHaveBeenCalledWith(
            expect.objectContaining({ isSubscription: true, billingType: 'MONTHLY', amount: 149 })
        );
    });
});
