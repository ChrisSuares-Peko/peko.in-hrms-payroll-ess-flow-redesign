jest.mock('../../models/entities/corporateUser', () => ({ update: jest.fn() }));
jest.mock('../../models/entities/subscription', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  bulkCreate: jest.fn(),
}));
jest.mock('../../models/entities/package', () => ({ findOne: jest.fn() }));
jest.mock('../../models/entities/order', () => ({ create: jest.fn() }));
jest.mock('../../models/use-cases/subscription', () => ({
  findExistingGroupPackage: jest.fn(),
  findAllActiveIndividualSubscriptions: jest.fn(),
  findExpiredBasePredecessor: jest.fn(),
  findAddonPrice: jest.fn(),
}));
jest.mock('../../models/use-cases/cashback', () => ({ findOneServiceCashbacks: jest.fn(), findOneByPackageId: jest.fn() }));
jest.mock('../../models/use-cases/pekoCredits', () => ({ updateOneCouponData: jest.fn(), findOneCouponData: jest.fn() }));
jest.mock('../resolveAddonTierPricing', () => ({ resolveAddonTierPricing: jest.fn() }));
jest.mock('../subscriptionPricing', () => ({
  calculateRemainingCost: jest.fn(),
  roundDownToNearest: jest.fn((value) => value),
  calculateSubscriptionPrice: jest.fn(),
  computeAddonEndDate: jest.fn(),
}));
jest.mock('../../services/GSTandTAXcalculation', () => ({ calculateTaxBreakdown: jest.fn() }));

const moment = require('moment');
const sequelize = require('../../configs/database/index');
const Subscription = require('../../models/entities/subscription');
const Package = require('../../models/entities/package');
const CorporateUser = require('../../models/entities/corporateUser');
const orders = require('../../models/entities/order');
const useCases = require('../../models/use-cases/subscription');
const { calculateSubscriptionPrice } = require('../subscriptionPricing');
const { calculateTaxBreakdown } = require('../../services/GSTandTAXcalculation');
const { createSubscription } = require('../subscription');

const today = () => moment().startOf('day').toDate();

const pekoPlus = {
  id: 92,
  packageName: 'Peko+',
  packagePrices: { monthly: 5000, annually: 50000 },
  discount: { monthly: 0, annually: 0 },
  packageType: 'GROUP',
};
const pekoGo = {
  id: 104,
  packageName: 'Peko Go',
  packagePrices: { monthly: 3000, annually: 30000 },
  discount: { monthly: 0, annually: 0 },
  packageType: 'GROUP',
};
const currentPekoGoEnd = moment().add(20, 'days').endOf('day').toDate();
const currentPekoGo = {
  id: 7,
  packageId: 104,
  package: { id: 104, packageName: 'Peko Go' },
  subscriptionEndDate: currentPekoGoEnd,
};
const quotedUpgradePricing = {
  expectedPaymentAmount: 56640,
  taxableAmount: 48000,
  taxAmount: 8640,
  taxRate: 18,
  totalDiscount: 2000,
  couponDiscount: 0,
  annualAddonPrice: 0,
  breakdown: { price: 2000, breakdown: [] },
};
const QUOTED_AT = '2026-10-06T18:29:00.000Z';

const oneTimeUpgrade = (overrides = {}) => ({
  packageId: 92,
  pgAmount: 56640,
  corporateId: 5,
  corporateTxnId: 1700000000000,
  billingType: 'ANNUALLY',
  credentialId: 9,
  partnerId: null,
  isOneTime: true,
  isInitialPurchase: true,
  quotedAt: QUOTED_AT,
  creditCurrentGroupPlan: true,
  paymentGatewayResponse: [{ payment_method: 'upi' }],
  ...overrides,
});

let tx;

describe('createSubscription — initial purchase vs renewal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tx = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(tx);
    Package.findOne.mockResolvedValue(pekoPlus);
    Subscription.findOne.mockImplementation(async (query) =>
      query?.attributes?.includes?.('vendorSubscriptionId') ? { vendorSubscriptionId: 'cf-mandate-1' } : null
    );
    Subscription.findAll.mockResolvedValue([]);
    Subscription.update.mockResolvedValue([1]);
    Subscription.create.mockImplementation(async (row) => ({ id: 99, ...row }));
    CorporateUser.update.mockResolvedValue([1]);
    orders.create.mockResolvedValue({ id: 555 });
    useCases.findExistingGroupPackage.mockResolvedValue(currentPekoGo);
    useCases.findAllActiveIndividualSubscriptions.mockResolvedValue({
      allActiveSubscriptions: [{ id: 7, packageId: 104, isCustom: 0, isCancelled: 0 }],
      previousAddons: [],
    });
    useCases.findExpiredBasePredecessor.mockResolvedValue(null);
    calculateSubscriptionPrice.mockResolvedValue(quotedUpgradePricing);
    calculateTaxBreakdown.mockResolvedValue({ taxableAmount: 0, taxAmount: 0, taxRate: 18, grossAmount: 0 });
  });

  it('prices a one-time upgrade as an initial purchase as of the quote, starts it today and retires the current plan', async () => {
    const result = await createSubscription(oneTimeUpgrade());

    expect(result.error).toBeUndefined();
    expect(calculateSubscriptionPrice).toHaveBeenCalledWith(
      expect.objectContaining({ authPayment: true, asOf: QUOTED_AT, creditCurrentGroupPlan: true })
    );
    expect(useCases.findExpiredBasePredecessor).not.toHaveBeenCalled();
    expect(Subscription.update).toHaveBeenCalledWith(
      { status: 'UPGRADED' },
      expect.objectContaining({ where: { packageId: 104, corporateUserId: 5 } })
    );
    const createdRow = Subscription.create.mock.calls[0][0];
    expect(createdRow.subscriptionStartDate).toEqual(today());
    expect(createdRow).toEqual(
      expect.objectContaining({
        subscriptionAmountPaid: 56640,
        taxableAmount: 48000,
        taxAmount: 8640,
        discount: 2000,
        vendorSubscriptionId: null,
        status: 'ACTIVE',
      })
    );
    expect(tx.commit).toHaveBeenCalled();
  });

  it('rejects an initial purchase whose paid amount differs from the quoted price', async () => {
    const result = await createSubscription(oneTimeUpgrade({ pgAmount: 59000 }));

    expect(result.error).toBe(true);
    expect(tx.rollback).toHaveBeenCalled();
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('passes the legacy-quote flag through to pricing', async () => {
    await createSubscription(oneTimeUpgrade({ creditCurrentGroupPlan: false }));

    expect(calculateSubscriptionPrice).toHaveBeenCalledWith(
      expect.objectContaining({ authPayment: true, creditCurrentGroupPlan: false })
    );
  });

  it('accepts a fully covered direct purchase and rejects one that is not covered', async () => {
    calculateSubscriptionPrice.mockResolvedValue({ ...quotedUpgradePricing, expectedPaymentAmount: 0, taxableAmount: 0, taxAmount: 0 });
    const covered = await createSubscription(
      oneTimeUpgrade({ pgAmount: 0, isOneTime: false, quotedAt: new Date().toISOString(), paymentGatewayResponse: undefined })
    );
    expect(covered.error).toBeUndefined();

    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(tx);
    calculateSubscriptionPrice.mockResolvedValue({ ...quotedUpgradePricing, expectedPaymentAmount: 1180 });
    const notCovered = await createSubscription(
      oneTimeUpgrade({ pgAmount: 0, isOneTime: false, quotedAt: new Date().toISOString(), paymentGatewayResponse: undefined })
    );
    expect(notCovered.error).toBe(true);
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('keeps renewal pricing and starts a renewal charge after the current cycle', async () => {
    Package.findOne.mockResolvedValue(pekoGo);
    Subscription.findOne.mockImplementation(async (query) => {
      if (query?.attributes?.includes?.('vendorSubscriptionId')) return { vendorSubscriptionId: 'cf-mandate-1' };
      return { id: 7, packageId: 104, subscriptionEndDate: currentPekoGoEnd, isCancelled: 0, package: { id: 104 } };
    });
    calculateSubscriptionPrice.mockResolvedValue({
      ...quotedUpgradePricing,
      expectedPaymentAmount: 3540,
      taxableAmount: 3000,
      taxAmount: 540,
      totalDiscount: 0,
    });

    const result = await createSubscription({
      packageId: 104,
      pgAmount: 3540,
      corporateId: 5,
      corporateTxnId: 1700000000001,
      billingType: 'MONTHLY',
      credentialId: 9,
      partnerId: null,
      authPayment: false,
      providerId: 'cf-payment-1',
      subscriptionId: 'cf-mandate-1',
      paymentGatewayResponse: { payment_amount: 3540 },
    });

    expect(result.error).toBeUndefined();
    expect(calculateSubscriptionPrice).toHaveBeenCalledWith(
      expect.objectContaining({ authPayment: false, asOf: undefined })
    );
    const createdRow = Subscription.create.mock.calls[0][0];
    expect(createdRow.status).toBe('PENDING');
    expect(createdRow.subscriptionStartDate).toEqual(moment(currentPekoGoEnd).add(1, 'day').startOf('day').toDate());
    expect(Subscription.update).not.toHaveBeenCalledWith(
      { status: 'UPGRADED' },
      expect.objectContaining({ where: { packageId: 104, corporateUserId: 5 } })
    );
  });
});
