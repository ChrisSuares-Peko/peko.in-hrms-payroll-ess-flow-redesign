jest.mock('../../../utils/subscription', () => ({
  createSubscription: jest.fn(),
  createSubscriptionForAddOns: jest.fn(),
}));
jest.mock('../cashFreeGateway', () => ({ cancelCashfreeSubscription: jest.fn() }));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../models/use-cases/subscription', () => ({ isTopTierGroupPackage: jest.fn().mockResolvedValue(false) }));
jest.mock('../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  refundWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
}));
jest.mock('../../../utils/emailTemplates/subscription', () => ({
  subscriptionIndividualSuccessEmail: jest.fn(() => '<p>ok</p>'),
  storagePurchaseSuccess: jest.fn(),
  subscriptionPekoPlusSuccessEmail: jest.fn(() => '<p>ok</p>'),
}));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn() }));
jest.mock('../../../utils/emailTemplate/payroll', () => ({ payrollAddOnEmployeesSuccess: jest.fn() }));
jest.mock('../../../utils/emailTemplate/turbo', () => ({ turboAddOnFleetSuccess: jest.fn() }));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn().mockResolvedValue({}) }));
jest.mock('../../../utils/emailTemplate/esr', () => ({ eSignAddONSuccessTemplate: jest.fn() }));
jest.mock('../../../utils/emailTemplate/eInvoice', () => ({ eInvoiceAddOnSuccessTemplate: jest.fn() }));
jest.mock('../../../utils/pgRefund', () => ({ cancelPGTransaction: jest.fn() }));
jest.mock('../../../models/use-cases/package', () => ({ findOne: jest.fn().mockResolvedValue({ packageName: 'Peko+' }) }));
jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateSubscriptionInvoiceAttachments: jest.fn().mockResolvedValue([]) }));
jest.mock('../../../models/use-cases/order', () => ({ findOneOrderByTxnId: jest.fn() }));

const { createSubscription } = require('../../../utils/subscription');
const { cancelPGTransaction } = require('../../../utils/pgRefund');
const { payment } = require('../subscription');

const user = { id: 9, corporateId: 5, email: 'ops@acme.in', name: 'Acme', username: 'acme', registeredBy: null };

const createdSubscription = {
  subscription: { billingType: 'ANNUALLY' },
  packageDetails: { id: 92, packageName: 'Peko+', packageType: 'GROUP' },
  currentSubscription: { package: { packageName: 'Peko Go' } },
  couponDiscount: 0,
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const run = async (req) => {
  const res = mockRes();
  const next = jest.fn();
  await payment(req, res, next);
  return { res, next };
};

describe('subscription.payment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createSubscription.mockResolvedValue(createdSubscription);
  });

  it('accepts only the plan fields on a direct call and prices it as a new purchase as of now', async () => {
    const before = Date.now();
    await run({
      user,
      body: {
        packageId: 92,
        pgAmount: 0,
        billingType: 'MONTHLY',
        couponCode: 'FULL',
        isOneTime: true,
        authPayment: true,
        isComplimentary: true,
        providerId: 'forged',
        subscriptionId: 'forged-mandate',
        paymentRefId: 123,
        quotedAt: '2020-01-01T00:00:00.000Z',
        paymentGatewayResponse: [{ payment_status: 'SUCCESS' }],
      },
    });

    expect(createSubscription).toHaveBeenCalledTimes(1);
    const input = createSubscription.mock.calls[0][0];
    expect(input).toEqual(
      expect.objectContaining({
        packageId: 92,
        pgAmount: 0,
        billingType: 'MONTHLY',
        couponCode: 'FULL',
        isOneTime: true,
        corporateId: 5,
        credentialId: 9,
        isInitialPurchase: true,
        creditCurrentGroupPlan: true,
      })
    );
    ['authPayment', 'isComplimentary', 'providerId', 'subscriptionId', 'paymentGatewayResponse'].forEach((key) =>
      expect(input).not.toHaveProperty(key)
    );
    expect(input.corporateTxnId).not.toBe(123);
    expect(input.quotedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('rejects a direct call that is not fully covered without creating anything', async () => {
    const { next } = await run({ user, body: { packageId: 92, pgAmount: 500, billingType: 'MONTHLY' } });

    expect(createSubscription).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));
  });

  it('passes a gateway-confirmed purchase through with its stored quote', async () => {
    await run({
      user,
      isGatewayConfirmedPurchase: true,
      gatewayOrderCreatedAt: new Date('2026-10-01T10:00:00.000Z'),
      body: {
        packageId: 92,
        pgAmount: 56640,
        billingType: 'ANNUALLY',
        isOneTime: true,
        paymentRefId: 777,
        quotedAt: '2026-10-06T18:29:00.000Z',
        paymentGatewayResponse: [{ payment_method: 'upi' }],
      },
    });

    expect(createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        corporateTxnId: 777,
        quotedAt: '2026-10-06T18:29:00.000Z',
        creditCurrentGroupPlan: true,
        isInitialPurchase: true,
        paymentGatewayResponse: [{ payment_method: 'upi' }],
      }),
      undefined
    );
  });

  it('prices a gateway-confirmed order created before quotes were stored under the old rules', async () => {
    const orderCreatedAt = new Date('2026-10-01T10:00:00.000Z');
    await run({
      user,
      isGatewayConfirmedPurchase: true,
      gatewayOrderCreatedAt: orderCreatedAt,
      body: { packageId: 92, pgAmount: 59000, billingType: 'ANNUALLY', isOneTime: true, paymentRefId: 778 },
    });

    expect(createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ quotedAt: orderCreatedAt, creditCurrentGroupPlan: false }),
      undefined
    );
  });

  it('refunds a failed purchase only when money was actually collected', async () => {
    createSubscription.mockResolvedValue({ error: true, message: 'Invalid group package price' });

    await run({ user, body: { packageId: 92, pgAmount: 0, billingType: 'MONTHLY', paymentGatewayResponse: [{}] } });
    expect(cancelPGTransaction).not.toHaveBeenCalled();

    await run({
      user,
      isGatewayConfirmedPurchase: true,
      body: { packageId: 92, pgAmount: 56640, billingType: 'ANNUALLY', paymentRefId: 779, quotedAt: '2026-10-06T18:29:00.000Z' },
    });
    expect(cancelPGTransaction).toHaveBeenCalledWith(779);
  });
});
