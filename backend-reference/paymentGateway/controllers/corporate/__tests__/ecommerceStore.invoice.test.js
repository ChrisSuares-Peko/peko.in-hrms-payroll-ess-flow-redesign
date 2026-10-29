jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../utils/emailSender', () => ({ paymentGateWayRefundFailureEmail: jest.fn() }));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn() }));
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
jest.mock('../../../utils/emailTemplates/ecommerceStore', () => ({
    generateEcommerceStorePaymentSuccessEmail: jest.fn(() => '<p>ok</p>'),
}));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));
jest.mock('../../../models/use-cases/package', () => ({ findOne: jest.fn() }));
jest.mock('../../../models/use-cases/serviceSubscription', () => ({ findActiveByAccessCode: jest.fn() }));

const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require('../../../utils/checkAndFetchServiceDetails');
const { createEcommerceStoreSubscription } = require('../../../utils/ecommerceStoreSubscription');
const { computeUpgradeCredit } = require('../../../utils/upgradeCredit');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { findOne: findPackage } = require('../../../models/use-cases/package');
const { findActiveByAccessCode } = require('../../../models/use-cases/serviceSubscription');
const { generateSubscriptionInvoiceAttachments } = require('../../../services/invoiceAndReceipt');
const emailer = require('../../../utils/emailer');
const { payment } = require('../ecommerceStore');

const request = body => ({
    LogTraceId: 'trace-1',
    user: { id: 1, corporateId: 2, packageId: 3, registeredBy: 9, state: 'Kerala', email: 'a@b.c', name: 'Acme', username: 'acme' },
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

const ATTACHMENTS = [{ filename: 'Receipt.pdf' }, { filename: 'Invoice.pdf' }];

beforeEach(() => {
    jest.clearAllMocks();
    fetchPartnerDetails.mockResolvedValue({ sharePercentage: 0, state: 'Kerala' });
    fetchServiceDetails.mockResolvedValue({ id: 5, surcharge: 0, surchargeType: 'FLAT', vendor: { vendorName: 'Peko Ecom' } });
    calculateSurcharge.mockReturnValue(0);
    calculateAmountWithTax.mockResolvedValue(0);
    findPackage.mockResolvedValue({ packageName: 'Growth', packagePrices: { monthly: 149, annually: 1499 }, commissionMode: 'MARGIN', commission: 0 });
    findActiveByAccessCode.mockResolvedValue(null);
    computeUpgradeCredit.mockReturnValue(0);
    computeJournalData.mockResolvedValue({ journalData: {} });
    createEcommerceStoreSubscription.mockResolvedValue({
        subscription: { id: 7 },
        packageDetails: { packageName: 'Growth' },
        orderId: 77,
        paymentMode: 'PAYMENT GATEWAY',
    });
    generateSubscriptionInvoiceAttachments.mockResolvedValue(ATTACHMENTS);
});

describe('the invoice of a Peko Commerce purchase', () => {
    it("is raised the way a Peko subscription is: one line for the plan on its cycle, nothing for a vendor", async () => {
        const res = response();
        await payment(request({}), res, jest.fn());

        expect(generateSubscriptionInvoiceAttachments).toHaveBeenCalledTimes(1);
        expect(generateSubscriptionInvoiceAttachments).toHaveBeenCalledWith({
            amount: 1499,
            couponDiscount: 0,
            corporateTxnId: 'TXN-1',
            orderId: 77,
            paymentType: 'Peko Commerce',
            description: 'Peko Commerce - Growth (Annually)',
            credentialId: 1,
            pgAmount: 1499,
            paymentMethod: 'upi',
            traceId: 'trace-1',
        });
        expect(emailer.emailWithMultipleAttachment).toHaveBeenCalledWith(
            ['a@b.c'],
            'Growth Plan Purchase Confirmation',
            '<p>ok</p>',
            ATTACHMENTS,
            undefined,
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('nets the coupon the way a Peko subscription does: the plan price before the coupon, the coupon beside it', async () => {
        await payment(request({ couponTotalDiscount: 100, pgAmount: 1399, amount: 1499 }), response(), jest.fn());

        expect(generateSubscriptionInvoiceAttachments).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 1499, couponDiscount: 100, pgAmount: 1399 })
        );
    });

    it('names a monthly plan on its monthly cycle however the duration was spelt', async () => {
        await payment(request({ subscriptionDuration: 'Monthly', pgAmount: 149, amount: 149 }), response(), jest.fn());

        expect(generateSubscriptionInvoiceAttachments).toHaveBeenCalledWith(
            expect.objectContaining({ description: 'Peko Commerce - Growth (Monthly)', amount: 149 })
        );
    });
});
