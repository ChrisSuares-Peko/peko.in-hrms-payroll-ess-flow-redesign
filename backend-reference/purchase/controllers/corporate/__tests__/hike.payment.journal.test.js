jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({
  fetchServiceDetails: jest.fn(),
  calculateSurcharge: jest.fn(() => 20),
  calculateAmountWithTax: jest.fn(async () => '23.60'),
}));
jest.mock('../../../utils/pamentGatewayTransaction', () => ({
  createPGTransaction: jest.fn(),
  createPaytmTransaction: jest.fn(),
}));
jest.mock('../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
}));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn(), email: jest.fn() }));
jest.mock('../../../models/use-cases/hike', () => ({ findAllActiveHikes: jest.fn(), findHikesByIds: jest.fn() }));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../utils/emailTemplate/common', () => ({ commonFailedTemplate: jest.fn(() => 'failed') }));
jest.mock('../../../utils/emailTemplate/hike', () => ({ generateHikePurchaseSuccessEmail: jest.fn(() => 'success') }));
jest.mock('../../../models/entities/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../../../models/use-cases/transaction', () => ({ findAllTransactions: jest.fn() }));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn() }));
jest.mock('../../../models/use-cases/order', () => ({ findOneOrderByTxnId: jest.fn() }));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const { fetchServiceDetails } = require('../../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction, updateWalletTransaction } = require('../../../utils/walletTransaction');
const { findHikesByIds } = require('../../../models/use-cases/hike');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const { generateOrderInvoiceAttachments } = require('../../../services/invoiceAndReceipt');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { publishJournalEvent } = require('../../../utils/bull/queue/accountingEventsQueue');
const { payment } = require('../hike');

const vendor = { vendorName: 'Hike Vendor', state: 'Kerala' };
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
const reportData = { journalData: { commissionIncludingGST: 236, commissionMode: 'MARGIN' } };

const hikeRecord = {
  id: 11,
  name: 'Gold Hike',
  amount: '1000.00',
  commissionMode: 'MARGIN',
  commissionType: 'PERCENTAGE',
  commission: '10',
  fixedCommissionPerTransaction: '0',
  isCommissionInclGST: false,
};

const expectedPlanDetails = [
  {
    name: 'Gold Hike',
    commissionMode: 'MARGIN',
    commissionType: 'PERCENTAGE',
    commission: '10',
    fixedCommissionPerTransaction: '0',
    isCommissionInclGST: false,
    amount: '1000.00',
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
    role: 'CORPORATE_USER',
  },
  body: { account: 'acc', amount: 2000, selectedHikes: [{ id: 11, quantity: 2 }], ...body },
});

const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), redirect: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  fetchServiceDetails.mockResolvedValue(serviceDetails);
  fetchPartnerDetails.mockResolvedValue(partnerDetails);
  findHikesByIds.mockResolvedValue([hikeRecord]);
  computeJournalData.mockResolvedValue(reportData);
  createWalletTransaction.mockResolvedValue({ orderId: 77, corporateFinalBalance: 100 });
  generateOrderInvoiceAttachments.mockResolvedValue([]);
});

describe('a hike purchase paid from the wallet', () => {
  it('works out its journal from the hikes bought', async () => {
    await payment(request({}), response(), jest.fn());

    expect(findHikesByIds).toHaveBeenCalledWith([11], 1);
    expect(computeJournalData).toHaveBeenCalledTimes(1);
    expect(computeJournalData).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceDetails,
        amount: 2000,
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

  it('keeps the journal with the order', async () => {
    await payment(request({}), response(), jest.fn());

    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ reportData }));
  });

  it('sends the payment to the journal once the wallet has been charged', async () => {
    await payment(request({}), response(), jest.fn());

    const { corporateTxnId } = createWalletTransaction.mock.calls[0][0];
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
    expect(publishJournalEvent.mock.invocationCallOrder[0]).toBeGreaterThan(
      updateWalletTransaction.mock.invocationCallOrder[0]
    );
  });

  it('carries the commission and plan into the invoice', async () => {
    await payment(request({}), response(), jest.fn());

    expect(generateOrderInvoiceAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: 'Hike',
        vendor,
        commissionIncludingGST: 236,
        planDetails: expectedPlanDetails,
        commissionMode: 'MARGIN',
      })
    );
    expect(generateOrderInvoiceAttachments.mock.calls[0][0]).not.toHaveProperty('sendInvoiceToVendor');
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
    expect(next.mock.calls[0][0].message).toBe('INSUFFICIENT WALLET BALANCE');
    expect(publishJournalEvent).not.toHaveBeenCalled();
    expect(generateOrderInvoiceAttachments).not.toHaveBeenCalled();
  });
});
