jest.mock('../../../models/use-cases/softwares_subscriptions', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../../../models/use-cases/softwares_subscriptions_plans', () => ({
  findAllPlans: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({
  fetchServiceDetails: jest.fn(),
  calculateSurcharge: jest.fn(() => 20),
  calculateAmountWithTax: jest.fn(async () => '23.60'),
}));
jest.mock('../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
  refundWalletTransaction: jest.fn(),
}));
jest.mock('../../../utils/emailTemplate/emailDomain', () => ({
  generateEmailDomainSuccessEmailToVendor: jest.fn(() => 'vendor'),
  generateEmailDomainSuccessEmailToInternals: jest.fn(() => 'internal'),
  generateEmailDomainSuccessEmail: jest.fn(() => 'success'),
}));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn(), email: jest.fn() }));
jest.mock('../../../utils/leanTransaction', () => ({ createLeanTransaction: jest.fn() }));
jest.mock('../payment_gateway', () => ({ cancelCardTransaction: jest.fn() }));
jest.mock('../../../utils/emailSender', () => ({
  paymentGateWayRefundFailureEmail: jest.fn(),
  leanRefundFailureEmail: jest.fn(),
}));
jest.mock('../lean', () => ({ createLeanPayoutRequest: jest.fn() }));
jest.mock('../../../utils/emailTemplate/common', () => ({ commonFailedTemplate: jest.fn(() => 'failed') }));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../models/use-cases/transaction', () => ({ findAllTransactions: jest.fn() }));
jest.mock('../../../models/entities/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn() }));
jest.mock('../../../models/use-cases/order', () => ({ findOneOrderByTxnId: jest.fn() }));
jest.mock('../../../utils/commonUploadFile', () => ({ uploadFile: jest.fn(async () => 'https://img.example.test/p.png') }));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const { findOne: findOnePlan } = require('../../../models/use-cases/softwares_subscriptions_plans');
const { fetchServiceDetails } = require('../../../utils/checkAndFetchServiceDetails');
const {
  createWalletTransaction,
  updateWalletTransaction,
  refundWalletTransaction,
} = require('../../../utils/walletTransaction');
const wallet = require('../../../models/entities/wallet');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const { generateOrderInvoiceAttachments } = require('../../../services/invoiceAndReceipt');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { publishJournalEvent } = require('../../../utils/bull/queue/accountingEventsQueue');
const { payment } = require('../software_subscriptions');

const vendor = { vendorName: 'Mail Vendor', state: 'Kerala' };
const partnerDetails = { sharePercentage: 0, state: 'Kerala' };
const serviceDetails = {
  id: 5,
  surcharge: 20,
  surchargeType: 'FLAT',
  commissionType: 'PERCENTAGE',
  cashbackType: 'FLAT',
  providerCommission: 2,
  cashback: 1,
  vendor,
};
const reportData = { journalData: { commissionIncludingGST: 118, commissionMode: 'MARGIN' } };

const planData = {
  id: 3,
  name: 'Business Standard',
  monthlyPrice: 500,
  yearlyPrice: 5000,
  softwaresSubscriptionId: 8,
  commissionMode: 'MARGIN',
  commissionType: 'PERCENTAGE',
  commission: 10,
  fixedCommissionPerTransaction: 0,
  isCommissionInclGST: false,
  softwares_subscription: {
    name: 'Google Workspace',
    vendor: { vendorName: 'Google', vendorEmail: 'google@example.test' },
    sendVendorMail: false,
    sendInternalMail: false,
    pekoEmail: 'ops@example.test',
  },
};

const expectedPlanDetails = [
  {
    name: 'Business Email : Business Standard',
    commissionMode: 'MARGIN',
    commissionType: 'PERCENTAGE',
    commission: 10,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: false,
    amount: 500,
    quantity: 2,
  },
];

const request = (body) => ({
  LogTraceId: 'trace-1',
  user: {
    id: 1,
    corporateId: 2,
    packageId: 3,
    registeredBy: 9,
    state: 'Kerala',
    username: 'corp',
    email: 'corp@example.test',
    name: 'Corp',
    mobileNo: '9999999999',
    role: 'CORPORATE_USER',
  },
  body: {
    account: 'acc',
    amount: 1000,
    planId: 3,
    billingType: 'MONTHLY',
    formDetails: { numberOfUsers: 2 },
    ...body,
  },
});

const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), redirect: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const eventTypes = () => publishJournalEvent.mock.calls.map(([event]) => event.type);

beforeEach(() => {
  jest.clearAllMocks();
  findOnePlan.mockResolvedValue(planData);
  fetchServiceDetails.mockResolvedValue(serviceDetails);
  fetchPartnerDetails.mockResolvedValue(partnerDetails);
  computeJournalData.mockResolvedValue(reportData);
  createWalletTransaction.mockResolvedValue({ orderId: 77, corporateFinalBalance: 100 });
  generateOrderInvoiceAttachments.mockResolvedValue([]);
  wallet.findOne.mockResolvedValue({ balance: 100 });
});

describe('a business email purchase paid from the wallet', () => {
  it('works out its journal from the plan and the number of users', async () => {
    await payment(request({}), response(), jest.fn());

    expect(computeJournalData).toHaveBeenCalledTimes(1);
    expect(computeJournalData).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceDetails,
        amount: 1000,
        paymentMethod: 'WALLET',
        paymentGatewayName: 'WALLET',
        partnerDetails,
        corporateState: 'Kerala',
        planDetails: expectedPlanDetails,
      })
    );
  });

  it('works out its journal as a wallet payment, whatever the request says about a gateway', async () => {
    await payment(request({ pgAmount: 500, couponTotalDiscount: 50 }), response(), jest.fn());

    const params = computeJournalData.mock.calls[0][0];
    expect(params.pgAmount ?? 0).toBe(0);
    expect(params.paymentMethod).toBe('WALLET');
    expect(params.paymentGatewayName).toBe('WALLET');
    expect(params.couponTotalDiscount).toBe(50);
  });

  it('prices a yearly plan on the yearly price', async () => {
    await payment(request({ billingType: 'ANNUALLY', amount: 10000 }), response(), jest.fn());

    expect(computeJournalData.mock.calls[0][0].planDetails[0].amount).toBe(5000);
  });

  it('keeps the journal with the order and sends the payment to the journal', async () => {
    await payment(request({}), response(), jest.fn());

    const { corporateTxnId } = createWalletTransaction.mock.calls[0][0];
    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ reportData }));
    expect(publishJournalEvent).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).toHaveBeenCalledWith(
      {
        transactionRef: corporateTxnId,
        type: 'payment',
        contextSnapshot: { credentialId: 1, vendor, registeredBy: 9 },
        reportData,
      },
      'trace-1'
    );
    expect(publishJournalEvent.mock.invocationCallOrder[0]).toBeGreaterThan(
      createWalletTransaction.mock.invocationCallOrder[0]
    );
  });

  it('carries the commission and plan into the invoice', async () => {
    await payment(request({}), response(), jest.fn());

    expect(generateOrderInvoiceAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: 'Business Emails',
        vendor,
        commissionIncludingGST: 118,
        planDetails: expectedPlanDetails,
        commissionMode: 'MARGIN',
      })
    );
    expect(generateOrderInvoiceAttachments.mock.calls[0][0]).not.toHaveProperty('sendInvoiceToVendor');
  });

  it('reverses the journal when the amount does not match the plan', async () => {
    await payment(request({ amount: 900 }), response(), jest.fn());

    expect(refundWalletTransaction).toHaveBeenCalledTimes(1);
    expect(eventTypes()).toEqual(['payment', 'refund']);
    expect(publishJournalEvent.mock.invocationCallOrder[1]).toBeGreaterThan(
      refundWalletTransaction.mock.invocationCallOrder[0]
    );
    expect(publishJournalEvent.mock.calls[1][0].reportData).toBe(reportData);
    expect(generateOrderInvoiceAttachments).not.toHaveBeenCalled();
    expect(updateWalletTransaction).toHaveBeenCalledTimes(1);
  });

  it('does not tell the invoice about any gateway money', async () => {
    await payment(request({}), response(), jest.fn());

    expect(generateOrderInvoiceAttachments.mock.calls[0][0]).not.toHaveProperty('pgAmount');
  });

  it('does not touch the journal when the wallet cannot pay', async () => {
    createWalletTransaction.mockResolvedValue({ error: 'INSUFFICIENT WALLET BALANCE' });
    const next = jest.fn();

    await payment(request({}), response(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).not.toHaveBeenCalled();
    expect(refundWalletTransaction).not.toHaveBeenCalled();
  });
});
