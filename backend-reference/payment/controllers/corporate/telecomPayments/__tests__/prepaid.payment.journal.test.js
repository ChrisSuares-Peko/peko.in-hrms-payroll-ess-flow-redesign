jest.mock('axios', () => jest.fn());
jest.mock('../../../../utils/checkAndFetchServiceDetails', () => ({
  fetchServiceDetails: jest.fn(),
  calculateSurchargeWithTax: jest.fn(),
}));
jest.mock('../../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
  refundWalletTransaction: jest.fn(),
}));
jest.mock('../../../../utils/pamentGatewayTransaction', () => ({
  createPGTransaction: jest.fn(),
  createPaytmTransaction: jest.fn(),
}));
jest.mock('../../../../models/entities/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn(), email: jest.fn() }));
jest.mock('../../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn() }));
jest.mock('../../../../models/use-cases/transaction', () => ({ getOneTransaction: jest.fn() }));
jest.mock('../../../../utils/jwtToken', () => ({ findUserDetails: jest.fn() }));
jest.mock('../../pluralGateway', () => ({ refundGatewayTransaction: jest.fn() }));
jest.mock('../../../../utils/encryptionUtils', () => ({ queryStringIntoBase64: jest.fn() }));
jest.mock('../../../../utils/emailTemplate/billpayments', () => ({
  generateMobilePaymentSuccessEmailBill: jest.fn(() => 'success'),
  commonFailedTemplateforBillPayments: jest.fn(() => 'failed'),
}));
jest.mock('../../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../../utils/cacheDataMethods', () => ({ setValue: jest.fn(), getValue: jest.fn() }));
jest.mock('../../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));
jest.mock('../../../../models/use-cases/mobileRechargeProvider', () => ({ findByProviderName: jest.fn() }));

const crypto = require('crypto');
const axios = require('axios');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../../../utils/checkAndFetchServiceDetails');
const {
  createWalletTransaction,
  updateWalletTransaction,
  refundWalletTransaction,
} = require('../../../../utils/walletTransaction');
const wallet = require('../../../../models/entities/wallet');
const { generateOrderInvoiceAttachments } = require('../../../../services/invoiceAndReceipt');
const { getOneTransaction } = require('../../../../models/use-cases/transaction');
const { findUserDetails } = require('../../../../utils/jwtToken');
const { fetchPartnerDetails } = require('../../../../models/use-cases/systemUser');
const { computeJournalData } = require('../../../../utils/computeJournalData');
const { publishJournalEvent } = require('../../../../utils/bull/queue/accountingEventsQueue');
const { findByProviderName } = require('../../../../models/use-cases/mobileRechargeProvider');
const { getValue } = require('../../../../utils/cacheDataMethods');
const { payment, updateTransaction, rechargeStatus } = require('../prepaid');

const vendor = {
  vendorName: 'JRI',
  state: 'Delhi',
  apiUrl: 'https://vendor.example.test',
  optional3: 'CORP-1',
  optional4: 'SECRET',
  optionals: { STATUS_URL: 'https://status.example.test' },
};
const partnerDetails = { sharePercentage: 0, state: 'Kerala' };
const serviceDetails = {
  id: 5,
  surcharge: 10,
  surchargeType: 'FLAT',
  commissionType: 'PERCENTAGE',
  cashbackType: 'FLAT',
  providerCommission: 1,
  cashback: 1,
  serviceProvider: 'Mobile Prepaid',
  vendor,
};
const provider = {
  commissionMode: 'MARGIN',
  commission: 2.5,
  commissionType: 'PERCENTAGE',
  fixedCommissionPerTransaction: 0,
  isCommissionInclGST: true,
};
const reportData = { journalData: { commissionIncludingGST: 5, commissionMode: 'MARGIN' } };

const user = {
  id: 1,
  corporateId: 2,
  packageId: 3,
  registeredBy: 9,
  state: 'Kerala',
  username: 'corp',
  email: 'corp@example.test',
  name: 'Corp',
  role: 'CORPORATE_USER',
};

const request = (body) => ({
  LogTraceId: 'trace-1',
  user,
  body: {
    account: '9999999999',
    amount: 199,
    serviceProvider: 'airtel',
    location: 'KL',
    accessKey: 'REDACTED',
    ...body,
  },
});

const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), send: jest.fn(), redirect: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const vendorReplies = (data) => axios.mockResolvedValue({ data });

const eventTypes = () => publishJournalEvent.mock.calls.map(([event]) => event.type);

beforeEach(() => {
  jest.clearAllMocks();
  fetchServiceDetails.mockResolvedValue(serviceDetails);
  calculateSurchargeWithTax.mockResolvedValue({ surcharge: 11.8, surchargeWithoutTax: 10 });
  fetchPartnerDetails.mockResolvedValue(partnerDetails);
  findByProviderName.mockResolvedValue(provider);
  getValue.mockResolvedValue(JSON.stringify([{ price: 199, real: 199, item: { Amount: 199 } }]));
  computeJournalData.mockResolvedValue(reportData);
  createWalletTransaction.mockResolvedValue({ orderId: 77, corporateFinalBalance: 100 });
  generateOrderInvoiceAttachments.mockResolvedValue([]);
  wallet.findOne.mockResolvedValue({ balance: 100 });
  vendorReplies({ Status: '0', TransactionReference: 'TR-1', Message: 'ok' });
});

describe('a mobile recharge paid from the wallet', () => {
  it('works out its journal with the commission of the provider recharged', async () => {
    await payment(request({}), response(), jest.fn());

    expect(findByProviderName).toHaveBeenCalledWith('airtel');
    expect(computeJournalData).toHaveBeenCalledTimes(1);
    expect(computeJournalData).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceDetails: { ...serviceDetails, ...provider },
        amount: 199,
        paymentMethod: 'WALLET',
        paymentGatewayName: 'WALLET',
        partnerDetails,
        corporateState: 'Kerala',
      })
    );
    expect(computeJournalData.mock.calls[0][0]).not.toHaveProperty('pgAmount');
  });

  it('falls back to the service commission when the provider has none on file', async () => {
    findByProviderName.mockResolvedValue(null);

    await payment(request({}), response(), jest.fn());

    expect(computeJournalData.mock.calls[0][0].serviceDetails).toBe(serviceDetails);
  });

  it('passes on the coupon share the request carries', async () => {
    await payment(request({ couponTotalDiscount: 50 }), response(), jest.fn());

    expect(computeJournalData.mock.calls[0][0].couponTotalDiscount).toBe(50);
  });

  it('keeps the journal with the order and sends the payment to the journal', async () => {
    await payment(request({}), response(), jest.fn());

    const { corporateTxnId } = createWalletTransaction.mock.calls[0][0];
    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: 199, reportData }));
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

  it('carries the commission and the recharge into the invoice', async () => {
    await payment(request({}), response(), jest.fn());

    expect(updateWalletTransaction).toHaveBeenCalledTimes(1);
    expect(generateOrderInvoiceAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: 'Mobile Recharge',
        vendor,
        commissionIncludingGST: 5,
        planDetails: [{ name: 'Airtel Mobile Recharge', amount: 199, quantity: 1 }],
        commissionMode: 'MARGIN',
      })
    );
    const invoice = generateOrderInvoiceAttachments.mock.calls[0][0];
    expect(invoice).not.toHaveProperty('pgAmount');
    expect(invoice).not.toHaveProperty('paymentMethod');
  });

  it('reverses the journal when the vendor fails the recharge', async () => {
    vendorReplies({ Status: '2', TransactionReference: 'TR-2', Message: 'failed' });

    await payment(request({}), response(), jest.fn());

    expect(refundWalletTransaction).toHaveBeenCalledTimes(1);
    expect(eventTypes()).toEqual(['payment', 'refund']);
    expect(publishJournalEvent.mock.invocationCallOrder[1]).toBeGreaterThan(
      refundWalletTransaction.mock.invocationCallOrder[0]
    );
    expect(publishJournalEvent.mock.calls[1][0].reportData).toBe(reportData);
    expect(generateOrderInvoiceAttachments).not.toHaveBeenCalled();
  });

  it('keeps the payment in the journal, with no refund, while the vendor is still processing', async () => {
    vendorReplies({ Status: '1', TransactionReference: 'TR-3', Message: 'in process' });

    await payment(request({}), response(), jest.fn());

    expect(refundWalletTransaction).not.toHaveBeenCalled();
    expect(eventTypes()).toEqual(['payment']);
  });

  it('recharges the plan price that was listed, not the marked-up amount paid', async () => {
    getValue.mockResolvedValue(JSON.stringify([{ price: 199, real: 170, item: { Amount: 170 } }]));

    await payment(request({}), response(), jest.fn());

    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: 199 }));
    expect(axios.mock.calls[0][0].data.Amount).toBe(170);
  });

  it('stops before anything is charged when the amount is not one of the listed plans', async () => {
    getValue.mockResolvedValue(JSON.stringify([{ price: 250, real: 250, item: { Amount: 250 } }]));
    const next = jest.fn();

    await payment(request({}), response(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].message).toMatch(/Plan prices have changed/);
    expect(createWalletTransaction).not.toHaveBeenCalled();
    expect(axios).not.toHaveBeenCalled();
  });

  it('does not touch the journal when the wallet cannot pay', async () => {
    createWalletTransaction.mockResolvedValue({ error: 'INSUFFICIENT WALLET BALANCE' });
    const next = jest.fn();

    await payment(request({}), response(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).not.toHaveBeenCalled();
    expect(axios).not.toHaveBeenCalled();
  });
});

describe('a recharge that fails after it was paid for', () => {
  const journalData = { commissionIncludingGST: 5 };
  const pending = (order) => ({
    status: 'PROCESSING',
    credentialId: 1,
    providerId: 'TR-9',
    order: { accountNo: '9999999999', baseAmount: 199, journalData, ...order },
  });

  const pushUpdate = (status) => {
    const checksum = crypto.createHash('sha256').update('9999999999' + 199 + 'TR-9' + 'SECRET').digest('hex');
    return {
      LogTraceId: 'trace-2',
      query: { SystemReference: 'TXN-9', Status: status, Message: 'failed', TransactionReference: 'TR-9', Checksum: checksum },
    };
  };

  const expectedRefundEvent = {
    transactionRef: 'TXN-9',
    type: 'refund',
    contextSnapshot: { credentialId: 1, vendor, registeredBy: 9 },
    reportData: { journalData },
  };

  beforeEach(() => {
    findUserDetails.mockResolvedValue(user);
  });

  it('is reversed in the journal when the vendor reports the failure', async () => {
    getOneTransaction.mockResolvedValue(pending());

    await updateTransaction(pushUpdate('2'), response(), jest.fn());

    expect(refundWalletTransaction).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).toHaveBeenCalledWith(expectedRefundEvent, 'trace-2');
    expect(publishJournalEvent.mock.invocationCallOrder[0]).toBeGreaterThan(
      refundWalletTransaction.mock.invocationCallOrder[0]
    );
  });

  it('is refunded without a journal entry when the order has no journal data', async () => {
    getOneTransaction.mockResolvedValue(pending({ journalData: null }));

    await updateTransaction(pushUpdate('2'), response(), jest.fn());

    expect(refundWalletTransaction).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).not.toHaveBeenCalled();
  });

  it('is not journalled when the vendor confirms the recharge', async () => {
    getOneTransaction.mockResolvedValue(pending());

    await updateTransaction(pushUpdate('0'), response(), jest.fn());

    expect(refundWalletTransaction).not.toHaveBeenCalled();
    expect(publishJournalEvent).not.toHaveBeenCalled();
  });

  it('is reversed in the journal when a status check finds it failed', async () => {
    getOneTransaction.mockResolvedValue(pending());
    vendorReplies({ Status: '2', Message: 'failed', TransactionReference: 'TR-9' });

    await rechargeStatus({ LogTraceId: 'trace-2', user, query: { systemReference: 'TXN-9' } }, response(), jest.fn());

    expect(refundWalletTransaction).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).toHaveBeenCalledWith(expectedRefundEvent, 'trace-2');
  });
});
