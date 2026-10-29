jest.mock('axios', () => jest.fn());
jest.mock('../../../models/use-cases/giftCards', () => ({
  findAllGiftCard: jest.fn(),
  findServiceOperatorByAccessKey: jest.fn(),
  findSingleGiftCard: jest.fn(),
  findServiceOperatorById: jest.fn(),
}));
jest.mock('../../../models/use-cases/order', () => ({
  findPopularGiftCards: jest.fn(),
  findOneOrderByTxnId: jest.fn(),
}));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn() }));
jest.mock('../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
  refundWalletTransaction: jest.fn(),
}));
jest.mock('../pluralGateway', () => ({ refundGatewayTransaction: jest.fn() }));
jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({
  fetchServiceDetails: jest.fn(),
  calculateSurchargeWithTax: jest.fn(),
}));
jest.mock('../../../utils/pamentGatewayTransaction', () => ({ createPGTransaction: jest.fn() }));
jest.mock('../../admin/giftCards', () => ({ authToken: jest.fn() }));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../utils/emailTemplates', () => ({
  generateGiftCardPaymentSuccessEmail: jest.fn(() => 'receiver mail'),
  generateGiftCardPaymentSuccessEmailToCompany: jest.fn(() => 'sender mail'),
  newGiftCard: jest.fn(() => '<html></html>'),
}));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn(), email: jest.fn() }));
jest.mock('../../../models/use-cases/transaction', () => ({ findAllTransactionsGiftCards: jest.fn() }));
jest.mock('../../../utils/cacheDataMethods', () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../utils/emailTemplate/common', () => ({ commonFailedTemplate: jest.fn(() => 'failed') }));
jest.mock('../../../utils/cashFreeGateway', () => ({ cancelPGTransaction: jest.fn() }));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const axios = require('axios');
const {
  findServiceOperatorByAccessKey,
  findSingleGiftCard,
  findServiceOperatorById,
} = require('../../../models/use-cases/giftCards');
const { generateOrderInvoiceAttachments } = require('../../../services/invoiceAndReceipt');
const { createWalletTransaction, refundWalletTransaction } = require('../../../utils/walletTransaction');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../../utils/checkAndFetchServiceDetails');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { publishJournalEvent } = require('../../../utils/bull/queue/accountingEventsQueue');
const { payment } = require('../giftCard');

const TOKEN_URL = 'https://token.example.test/';
const vendor = { vendorName: 'Gift Vendor', state: 'Kerala' };
const partnerDetails = { sharePercentage: 0, state: 'Kerala' };
const serviceDetails = {
  id: 5,
  surcharge: 10,
  surchargeType: 'FLAT',
  commissionType: 'PERCENTAGE',
  cashbackType: 'FLAT',
  providerCommission: 2,
  cashback: 1,
  vendor,
};
const reportData = { journalData: { commissionIncludingGST: 59, commissionMode: 'MARGIN' } };

const card = {
  id: 21,
  merchant_id: 'M1',
  product_id: 'P1',
  product_name: 'Amazon 500',
  merchant_name: 'Amazon',
  brand_name: 'Amazon',
  serviceOperatorId: 4,
  commissionMode: 'MARGIN',
  commissionType: 'PERCENTAGE',
  commission: 5,
  fixedCommissionPerTransaction: 0,
  isCommissionInclGST: false,
};

const expectedPlanDetails = [
  {
    commissionMode: 'MARGIN',
    name: 'Gift Card : Amazon 500',
    commissionType: 'PERCENTAGE',
    commission: 5,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: false,
    amount: 500,
    quantity: 2,
  },
];

const request = (body) => ({
  LogTraceId: 'trace-1',
  protocol: 'https',
  get: () => 'purchase.example.test',
  user: {
    id: 1,
    corporateId: 2,
    packageId: 3,
    registeredBy: 9,
    state: 'Kerala',
    username: 'corp',
    email: 'corp@example.test',
    name: 'Corp',
    role: 'CORPORATE_USER',
  },
  body: { giftCardId: 21, number_of_items: 2, amount: 1000, account: 'acc', ...body },
});

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const vendorReplies = (voucherBody) =>
  axios.mockImplementation(async (config) =>
    config.url === TOKEN_URL ? { data: { access_token: 'token' } } : { data: voucherBody }
  );

const eventTypes = () => publishJournalEvent.mock.calls.map(([event]) => event.type);

beforeEach(() => {
  jest.clearAllMocks();
  findSingleGiftCard.mockResolvedValue({ dataValues: card, sold_quantity: 0, save: jest.fn() });
  findServiceOperatorById.mockResolvedValue({ accessKey: 'gift-card' });
  findServiceOperatorByAccessKey.mockResolvedValue({
    vendor: { optional1: 'id', optional2: 'secret', optional3: 'scope', optional4: TOKEN_URL, optional5: 'c', optional6: 's' },
  });
  fetchServiceDetails.mockResolvedValue(serviceDetails);
  calculateSurchargeWithTax.mockResolvedValue({ surcharge: 11.8 });
  fetchPartnerDetails.mockResolvedValue(partnerDetails);
  computeJournalData.mockResolvedValue(reportData);
  createWalletTransaction.mockResolvedValue({ orderId: 77, corporateFinalBalance: 100 });
  generateOrderInvoiceAttachments.mockResolvedValue([]);
  vendorReplies({ meta: { status: 'succeeded' }, data: [{ voucher_ref: 'V1' }, { voucher_ref: 'V2' }] });
});

describe('a gift card purchase paid from the wallet', () => {
  it('works out its journal from the card and the quantity bought', async () => {
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

  it('keeps the journal with the order and sends the payment to the journal', async () => {
    await payment(request({}), response(), jest.fn());

    const { corporateTxnId } = createWalletTransaction.mock.calls[0][0];
    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ reportData, amount: 1000 }));
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

  it('carries the commission and the card into the invoice', async () => {
    await payment(request({}), response(), jest.fn());

    expect(generateOrderInvoiceAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: 'Gift Cards/Vouchers',
        vendor,
        commissionIncludingGST: 59,
        planDetails: expectedPlanDetails,
        commissionMode: 'MARGIN',
      })
    );
  });

  it('reverses the journal when the vendor cannot supply the vouchers', async () => {
    vendorReplies({ meta: { status: 'failed' }, data: [] });

    await payment(request({}), response(), jest.fn());

    expect(refundWalletTransaction).toHaveBeenCalledTimes(1);
    expect(eventTypes()).toEqual(['payment', 'refund']);
    expect(publishJournalEvent.mock.invocationCallOrder[1]).toBeGreaterThan(
      refundWalletTransaction.mock.invocationCallOrder[0]
    );
    expect(publishJournalEvent.mock.calls[1][0].reportData).toBe(reportData);
    expect(generateOrderInvoiceAttachments).not.toHaveBeenCalled();
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
