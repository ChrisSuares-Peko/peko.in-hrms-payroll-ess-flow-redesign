jest.mock('../../models/use-cases/pekoCredits', () => ({ findOneCoupon: jest.fn() }));
jest.mock('../calculateDiscount', () => ({ calculateDiscountResponse: jest.fn() }));
jest.mock('../pekoEcomEvents', () => ({
    fireSubscriptionCreated: jest.fn(),
    fireSubscriptionUpgraded: jest.fn(),
    fireSubscriptionRenewed: jest.fn(),
}));
jest.mock('../checkAndFetchServiceDetails', () => ({ fetchServiceDetails: jest.fn() }));
jest.mock('../../models/use-cases/corporateUser', () => ({ findOneCorporate: jest.fn() }));
jest.mock('../../models/use-cases/package', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/serviceSubscription', () => ({ findActiveByAccessCode: jest.fn() }));
jest.mock('../computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));
jest.mock('../upgradeCredit', () => ({ computeUpgradeCredit: jest.fn() }));

const { fetchServiceDetails } = require('../checkAndFetchServiceDetails');
const { findOneCorporate } = require('../../models/use-cases/corporateUser');
const { findOne: findPackage } = require('../../models/use-cases/package');
const { computeJournalData } = require('../computeJournalData');
const { publishJournalEvent } = require('../bull/queue/accountingEventsQueue');
const subscriptions = require('../ecommerceStoreSubscription');
const { computeUpgradeCredit } = require('../upgradeCredit');

const PARTNER = { sharePercentage: 10, state: 'Kerala' };

// The journal is built inside the mandate (AUTH) handler; the subscription row it goes on to write is not under test.
const build = ({ subscriptionTags, ...overrides } = {}) =>
    subscriptions.createEcommerceStoreSubscriptionFromWebhook({
        subscriptionTags: {
            credentialId: 1,
            corporateId: 2,
            packageId: 40,
            billingType: 'ANNUALLY',
            pgAmount: 1499,
            couponTotalDiscount: 0,
            partnerId: 9,
            ...subscriptionTags,
        },
        packageDetails: { packageName: 'Growth' },
        vendorSubscriptionId: 'sub_1',
        serviceOperatorId: 5,
        paymentGatewayResponse: { data: { payment_method: 'upi' } },
        partnerDetails: PARTNER,
        ...overrides,
    });

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(subscriptions, 'createEcommerceStoreSubscription').mockResolvedValue({ subscription: { id: 7 } });
    computeUpgradeCredit.mockReturnValue(0);
    fetchServiceDetails.mockResolvedValue({ id: 5, vendor: { vendorName: 'Peko Ecom' } });
    findOneCorporate.mockResolvedValue({ id: 2, state: 'Kerala' });
    findPackage.mockResolvedValue({
        packageName: 'Growth',
        packagePrices: { monthly: 149, annually: 1499 },
        commissionMode: 'MARGIN',
        commissionType: 'PERCENTAGE',
        commission: 0,
        isCommissionConfigured: true,
    });
    computeJournalData.mockResolvedValue({ journalData: { netSubscriptionIncome: 1270.34 } });
});

afterEach(() => jest.restoreAllMocks());

describe('the journal behind a Peko Commerce mandate payment', () => {
    it("is worked out as Peko's own subscription on the annual cycle, at the plan's price", async () => {
        const result = await build();

        expect(computeJournalData).toHaveBeenCalledTimes(1);
        expect(computeJournalData).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 1499,
                pgAmount: 1499,
                isSubscription: true,
                billingType: 'ANNUALLY',
                corporateState: 'Kerala',
                partnerDetails: PARTNER,
                paymentMethod: { name: 'upi', code: 'upi' },
            })
        );
        expect(computeJournalData.mock.calls[0][0].planDetails[0].amount).toBe(1499);
        expect(result).toEqual({ subscription: { id: 7 } });
        expect(publishJournalEvent).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'payment', reportData: { journalData: { netSubscriptionIncome: 1270.34 } } })
        );
    });

    it('books a monthly cycle whatever case the stored cycle is in, net of an upgrade credit', async () => {
        computeUpgradeCredit.mockReturnValue(49);

        await build({ subscriptionTags: { billingType: 'monthly', pgAmount: 100 } });

        expect(computeJournalData).toHaveBeenCalledWith(
            expect.objectContaining({ isSubscription: true, billingType: 'MONTHLY', amount: 100 })
        );
    });

    it('works nothing out when the service cannot be read', async () => {
        fetchServiceDetails.mockResolvedValue({ error: 'unavailable' });

        await build();

        expect(computeJournalData).not.toHaveBeenCalled();
        expect(publishJournalEvent).not.toHaveBeenCalled();
    });
});
