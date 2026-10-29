jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({
  fetchServiceDetails: jest.fn(),
  calculateSurchargeWithTax: jest.fn(),
}));
jest.mock('../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
  refundWalletTransaction: jest.fn(),
}));
jest.mock('../../../utils/pamentGatewayTransaction', () => ({ createPGTransaction: jest.fn() }));
jest.mock('../bbps', () => ({
  fetchBillFromApi: jest.fn(),
  paymentApi: jest.fn(),
  billValidationApi: jest.fn(),
  getBillerByBillerID: jest.fn(),
}));
jest.mock('../pluralGateway', () => ({ refundGatewayTransaction: jest.fn() }));
jest.mock('../../../models/use-cases/billerMDM', () => ({ findRecordByBillerId: jest.fn() }));
jest.mock('../../../models/use-cases/billFetchLog', () => ({ create: jest.fn() }));
jest.mock('../../../models/entities/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn(), email: jest.fn() }));
jest.mock('../../../utils/emailTemplate/billpayments', () => ({
  generateMobilePaymentSuccessEmailBill: jest.fn(() => 'success'),
  commonFailedTemplateforBillPayments: jest.fn(() => 'failed'),
}));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../utils/billAvenueWallet', () => ({
  checkBillAvenueBalance: jest.fn(),
  decrementBillAvenueBalance: jest.fn(),
  notifyBillAvenueLowBalance: jest.fn(),
}));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn() }));
jest.mock('../../../utils/billPayments_utils', () => ({
  assertBbpsChannelAmount: jest.fn(),
  resolveInitChannel: jest.fn(),
}));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../../utils/checkAndFetchServiceDetails');
const {
  createWalletTransaction,
  updateWalletTransaction,
  refundWalletTransaction,
} = require('../../../utils/walletTransaction');
const { paymentApi, getBillerByBillerID } = require('../bbps');
const wallet = require('../../../models/entities/wallet');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const { checkBillAvenueBalance, decrementBillAvenueBalance } = require('../../../utils/billAvenueWallet');
const { generateOrderInvoiceAttachments } = require('../../../services/invoiceAndReceipt');
const { assertBbpsChannelAmount, resolveInitChannel } = require('../../../utils/billPayments_utils');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { publishJournalEvent } = require('../../../utils/bull/queue/accountingEventsQueue');
const { commonBillHandler } = require('../commonBillHandler');

const { payment } = commonBillHandler('bbps_utility_electricity', 'Utility Payments', 'Electricity');

const vendor = { vendorName: 'BillAvenue', state: 'Maharashtra', optional5: 'AGENT', optionals: {} };
const partnerDetails = { sharePercentage: 0, state: 'Kerala' };
const serviceDetails = {
  id: 5,
  surcharge: 20,
  surchargeType: 'FLAT',
  commissionType: 'PERCENTAGE',
  cashbackType: 'FLAT',
  providerCommission: 1,
  cashback: 1,
  serviceProvider: 'Electricity',
  vendor,
};
const reportData = { journalData: { commissionIncludingGST: 35, commissionMode: 'MARGIN' } };

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
    billerId: 'KSEB00000KER01',
    billerName: 'KSEB',
    requestId: 'REQ-1',
    amount: 1000,
    customerParams: { input: [{ paramName: 'Consumer No', paramValue: '12345' }] },
    ...body,
  },
});

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const eventTypes = () => publishJournalEvent.mock.calls.map(([event]) => event.type);

beforeEach(() => {
  jest.clearAllMocks();
  fetchServiceDetails.mockResolvedValue(serviceDetails);
  calculateSurchargeWithTax.mockResolvedValue({ surcharge: 23.6 });
  fetchPartnerDetails.mockResolvedValue(partnerDetails);
  computeJournalData.mockResolvedValue(reportData);
  createWalletTransaction.mockResolvedValue({ orderId: 77, corporateFinalBalance: 100 });
  getBillerByBillerID.mockResolvedValue({});
  resolveInitChannel.mockReturnValue('AGT');
  assertBbpsChannelAmount.mockResolvedValue(null);
  checkBillAvenueBalance.mockResolvedValue({ sufficient: true, balance: 100000 });
  decrementBillAvenueBalance.mockResolvedValue();
  paymentApi.mockResolvedValue({ status: true, data: { txnRefId: 'TXN-REF-1' } });
  generateOrderInvoiceAttachments.mockResolvedValue([]);
  wallet.findOne.mockResolvedValue({ balance: 100 });
});

describe('a bill payment paid from the wallet', () => {
  it('works out its journal on the bill amount, as a wallet payment', async () => {
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
      })
    );
    expect(computeJournalData.mock.calls[0][0]).not.toHaveProperty('pgAmount');
  });

  it('passes on the coupon share the request carries', async () => {
    await payment(request({ couponTotalDiscount: 50 }), response(), jest.fn());

    expect(computeJournalData.mock.calls[0][0].couponTotalDiscount).toBe(50);
  });

  it('keeps the journal with the order and sends the payment to the journal', async () => {
    await payment(request({}), response(), jest.fn());

    const { corporateTxnId } = createWalletTransaction.mock.calls[0][0];
    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: '1000.00', reportData }));
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

  it('carries the commission and the bill into the invoice', async () => {
    await payment(request({}), response(), jest.fn());

    expect(updateWalletTransaction).toHaveBeenCalledTimes(1);
    expect(generateOrderInvoiceAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: 'Utility Payments',
        vendor,
        commissionIncludingGST: 35,
        planDetails: [{ name: 'Bill Payment : KSEB', amount: 1000, quantity: 1 }],
        commissionMode: 'MARGIN',
      })
    );
    const invoice = generateOrderInvoiceAttachments.mock.calls[0][0];
    expect(invoice).not.toHaveProperty('pgAmount');
    expect(invoice).not.toHaveProperty('paymentMethod');
  });

  it('reverses the journal when the biller does not take the payment', async () => {
    paymentApi.mockResolvedValue({ status: false, data: { message: 'rejected', errorInfo: { error: { errorCode: 'E100' } } } });

    await payment(request({}), response(), jest.fn());

    expect(refundWalletTransaction).toHaveBeenCalledTimes(1);
    expect(eventTypes()).toEqual(['payment', 'refund']);
    expect(publishJournalEvent.mock.invocationCallOrder[1]).toBeGreaterThan(
      refundWalletTransaction.mock.invocationCallOrder[0]
    );
    expect(publishJournalEvent.mock.calls[1][0].reportData).toBe(reportData);
    expect(generateOrderInvoiceAttachments).not.toHaveBeenCalled();
  });

  it('keeps the payment in the journal, with no refund, while the biller is still confirming', async () => {
    paymentApi.mockResolvedValue({ status: false, awaited: true, data: { txnRefId: 'TXN-REF-2' } });

    await payment(request({}), response(), jest.fn());

    expect(refundWalletTransaction).not.toHaveBeenCalled();
    expect(eventTypes()).toEqual(['payment']);
  });

  it('does not touch the journal when the wallet cannot pay', async () => {
    createWalletTransaction.mockResolvedValue({ error: 'INSUFFICIENT WALLET BALANCE' });
    const next = jest.fn();

    await payment(request({}), response(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).not.toHaveBeenCalled();
    expect(paymentApi).not.toHaveBeenCalled();
  });
});
