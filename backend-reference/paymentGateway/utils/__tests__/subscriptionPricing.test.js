const {
  calculateSubscriptionPrice,
  calculateRemainingCost,
} = require('../subscriptionPricing');
const useCases = require('../../models/use-cases/subscription');
const { calculateDiscount } = require('../calculateDiscount');
const { getGstDetails } = require('../../models/use-cases/setting');

jest.mock('../../models/entities/subscription', () => ({}));
jest.mock('../../models/entities/package', () => ({}));
jest.mock('../../models/use-cases/subscription', () => ({
  findAllActiveIndividualSubscriptions: jest.fn(),
  findExistingGroupPackage: jest.fn(),
  findAddonPrice: jest.fn(),
  findAllSubscription: jest.fn(),
  findAllAddonSubscription: jest.fn(),
}));
jest.mock('../../models/use-cases/serviceOperator', () => ({ findOneById: jest.fn() }));
jest.mock('../../models/use-cases/packages', () => ({ findOnePackage: jest.fn() }));
jest.mock('../calculateDiscount', () => ({ calculateDiscount: jest.fn() }));
jest.mock('../../models/use-cases/setting', () => ({ getGstDetails: jest.fn() }));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const individualPackage = (monthly = 999, discountMonthly = 0) => ({
  id: 11,
  packageType: 'INDIVIDUAL',
  packagePrices: { monthly, annually: monthly * 10 },
  discount: { monthly: discountMonthly, annually: 0 },
});

describe('calculateSubscriptionPrice — GST add-on', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getGstDetails.mockResolvedValue({ details: { gst: 18, type: 'PERCENTAGE' } });
    useCases.findAllSubscription.mockResolvedValue([]);
    useCases.findAllAddonSubscription.mockResolvedValue([]);
    useCases.findExistingGroupPackage.mockResolvedValue(null);
    calculateDiscount.mockResolvedValue({ success: false });
  });

  it('AUTH: expectedPaymentAmount is the GROSS (net + tax) and the breakdown fields are returned', async () => {
    const pricing = await calculateSubscriptionPrice({
      corporateId: 1,
      packageDetails: individualPackage(999),
      billingType: 'MONTHLY',
      authPayment: true,
    });
    expect(pricing.taxableAmount).toBe(999);
    expect(pricing.taxAmount).toBe(179.82);
    expect(pricing.taxRate).toBe(18);
    expect(pricing.expectedPaymentAmount).toBe(1178.82);
  });

  it('coupon applies PRE-GST: tax is computed on the post-coupon net', async () => {
    calculateDiscount.mockResolvedValue({ success: true, data: { discountAmount: '99' } });
    const pricing = await calculateSubscriptionPrice({
      corporateId: 1,
      packageDetails: individualPackage(999),
      billingType: 'MONTHLY',
      couponCode: 'SAVE99',
      authPayment: true,
    });
    // coupon base is the pre-GST net (999), not the gross
    expect(calculateDiscount).toHaveBeenCalledWith(1, 'SAVE99', 999, 11, null, 'MONTHLY', false, undefined);
    expect(pricing.couponDiscount).toBe(99);
    expect(pricing.taxableAmount).toBe(900);
    expect(pricing.taxAmount).toBe(162);
    expect(pricing.expectedPaymentAmount).toBe(1062);
  });

  it('fully-covered purchase: net 0 ⇒ tax 0 ⇒ gross 0', async () => {
    calculateDiscount.mockResolvedValue({ success: true, data: { discountAmount: '999' } });
    const pricing = await calculateSubscriptionPrice({
      corporateId: 1,
      packageDetails: individualPackage(999),
      billingType: 'MONTHLY',
      couponCode: 'FULLCREDIT',
      authPayment: true,
    });
    expect(pricing.taxableAmount).toBe(0);
    expect(pricing.taxAmount).toBe(0);
    expect(pricing.expectedPaymentAmount).toBe(0);
  });

  it('plan discount reduces the taxable base', async () => {
    const pricing = await calculateSubscriptionPrice({
      corporateId: 1,
      packageDetails: individualPackage(1000, 100),
      billingType: 'MONTHLY',
      authPayment: true,
    });
    expect(pricing.taxableAmount).toBe(900);
    expect(pricing.expectedPaymentAmount).toBe(1062);
  });
});

describe('calculateSubscriptionPrice — GROUP upgrade credit', () => {
  const pekoPlus = {
    id: 92,
    packageType: 'GROUP',
    packagePrices: { monthly: 5000, annually: 50000 },
    discount: { monthly: 0, annually: 0 },
  };
  const consumableCashback = {
    unitPrice: 0,
    baseLimit: 0,
    packageId: 104,
    serviceOperator: { id: 130, isDynamicUnitPricing: 0 },
  };
  const activeBase = (overrides = {}) => {
    const start = new Date();
    start.setDate(start.getDate() - 10);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return {
      id: 7,
      packageId: 104,
      serviceOperatorId: null,
      isCustom: 0,
      isCancelled: false,
      isGracePeriod: false,
      billingType: 'MONTHLY',
      subscriptionStartDate: start,
      subscriptionEndDate: end,
      subscriptionAmountPaid: '3540',
      taxableAmount: '3000',
      ...overrides,
    };
  };
  const roundDown = value => Math.floor(value * 100) / 100;

  beforeEach(() => {
    jest.clearAllMocks();
    getGstDetails.mockResolvedValue({ details: { gst: 18, type: 'PERCENTAGE' } });
    useCases.findAllAddonSubscription.mockResolvedValue([]);
    useCases.findExistingGroupPackage.mockResolvedValue({ package: { id: 104 } });
    useCases.findAddonPrice.mockResolvedValue(consumableCashback);
    calculateDiscount.mockResolvedValue({ success: false });
  });

  it('credits the unused period of the current group plan even when its first bundled service is consumable', async () => {
    const pekoGo = activeBase();
    useCases.findAllActiveIndividualSubscriptions.mockResolvedValue({
      allActiveSubscriptions: [pekoGo],
      previousAddons: [],
    });

    const pricing = await calculateSubscriptionPrice({
      corporateId: 1,
      packageDetails: pekoPlus,
      billingType: 'MONTHLY',
      authPayment: true,
    });

    const expectedCredit = roundDown(calculateRemainingCost(pekoGo, 0.18));
    expect(expectedCredit).toBeGreaterThan(0);
    expect(pricing.additionalDiscount).toBe(expectedCredit);
    expect(pricing.breakdown.price).toBe(expectedCredit);
    expect(pricing.breakdown.breakdown).toEqual([
      expect.objectContaining({ subscriptionId: 7, packageId: 104, isAddon: false }),
    ]);
    expect(pricing.taxableAmount).toBeCloseTo(5000 - expectedCredit, 2);
  });

  it('still gives no credit for a consumable service bought separately', async () => {
    useCases.findAllActiveIndividualSubscriptions.mockResolvedValue({
      allActiveSubscriptions: [activeBase({ id: 8, packageId: 300 })],
      previousAddons: [],
    });

    const pricing = await calculateSubscriptionPrice({
      corporateId: 1,
      packageDetails: pekoPlus,
      billingType: 'MONTHLY',
      authPayment: true,
    });

    expect(pricing.additionalDiscount).toBe(0);
    expect(pricing.breakdown.price).toBe(0);
    expect(pricing.taxableAmount).toBe(5000);
  });

  it('computes the credit as of the quote date, not today', async () => {
    const pekoGo = activeBase();
    useCases.findAllActiveIndividualSubscriptions.mockResolvedValue({
      allActiveSubscriptions: [pekoGo],
      previousAddons: [],
    });
    const quotedAt = new Date();
    quotedAt.setDate(quotedAt.getDate() - 3);
    const request = { corporateId: 1, packageDetails: pekoPlus, billingType: 'MONTHLY', authPayment: true };

    const atQuote = await calculateSubscriptionPrice({ ...request, asOf: quotedAt });
    const atNow = await calculateSubscriptionPrice(request);

    expect(atQuote.additionalDiscount).toBe(roundDown(calculateRemainingCost(pekoGo, 0.18, quotedAt)));
    expect(atQuote.additionalDiscount).toBeGreaterThan(atNow.additionalDiscount);
    expect(atQuote.breakdown.price).toBe(atQuote.additionalDiscount);
  });

  it('prices a quote made under the old rules without the current-plan credit', async () => {
    useCases.findAllActiveIndividualSubscriptions.mockResolvedValue({
      allActiveSubscriptions: [activeBase()],
      previousAddons: [],
    });

    const pricing = await calculateSubscriptionPrice({
      corporateId: 1,
      packageDetails: pekoPlus,
      billingType: 'MONTHLY',
      authPayment: true,
      creditCurrentGroupPlan: false,
    });

    expect(pricing.breakdown.price).toBe(0);
    expect(pricing.taxableAmount).toBe(5000);
  });
});

describe('calculateRemainingCost — net-based proration', () => {
  const cycle = (overrides = {}) => {
    const start = new Date();
    start.setDate(start.getDate() - 10); // 10 days in
    const end = new Date(start);
    end.setDate(end.getDate() + 30); // 30-day cycle
    return {
      subscriptionStartDate: start,
      subscriptionEndDate: end,
      isGracePeriod: false,
      ...overrides,
    };
  };

  it('prefers the recorded taxableAmount (GST-era row) over the gross amount paid', () => {
    const sub = cycle({ subscriptionAmountPaid: '1178.82', taxableAmount: '999' });
    const withTaxable = calculateRemainingCost(sub, 0.18);
    const netReference = calculateRemainingCost(
      cycle({ subscriptionAmountPaid: '999', taxableAmount: null }),
      0 // legacy carve-out disabled: paid amount IS the net here
    );
    expect(withTaxable).toBeCloseTo(netReference, 6);
  });

  it('carves the tax out of a legacy (NULL taxableAmount) row via the legacy rate', () => {
    const legacy = cycle({ subscriptionAmountPaid: '1180', taxableAmount: null });
    const carved = calculateRemainingCost(legacy, 0.18);
    const uncarved = calculateRemainingCost(legacy, 0);
    expect(carved).toBeCloseTo(uncarved / 1.18, 6);
  });

  it('returns 0 for a grace-period subscription', () => {
    expect(calculateRemainingCost(cycle({ isGracePeriod: true, subscriptionAmountPaid: '1180' }), 0.18)).toBe(0);
  });
});
