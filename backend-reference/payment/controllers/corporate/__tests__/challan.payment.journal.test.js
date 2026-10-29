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
jest.mock('../pluralGateway', () => ({ refundGatewayTransaction: jest.fn() }));
jest.mock('../../../utils/droomClient', () => ({
  getDroomToken: jest.fn(),
  fetchChallans: jest.fn(),
  pushOrder: jest.fn(),
  getOrderDetail: jest.fn(),
}));
jest.mock('../../../models/entities/garage_fleet', () => ({}));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn(), email: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn() }));
jest.mock('../../../utils/emailTemplate/billpayments', () => ({
  generateMobilePaymentSuccessEmailBill: jest.fn(() => 'success'),
  commonFailedTemplateforBillPayments: jest.fn(() => 'failed'),
}));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../models/entities/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../../../models/entities/order', () => ({}));
jest.mock('../../../models/entities/serviceOperator', () => ({}));
jest.mock('../../../models/entities/fleetChallanCache', () => ({ update: jest.fn() }));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../../utils/checkAndFetchServiceDetails');
const {
  createWalletTransaction,
  updateWalletTransaction,
  refundWalletTransaction,
} = require('../../../utils/walletTransaction');
const { getDroomToken, pushOrder } = require('../../../utils/droomClient');
const { generateOrderInvoiceAttachments } = require('../../../services/invoiceAndReceipt');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const wallet = require('../../../models/entities/wallet');
const fleetChallanCache = require('../../../models/entities/fleetChallanCache');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { publishJournalEvent } = require('../../../utils/bull/queue/accountingEventsQueue');
const { payment } = require('../challan');

const vendor = { vendorName: 'Droom', state: 'Karnataka' };
const partnerDetails = { sharePercentage: 0, state: 'Kerala' };
const serviceDetails = {
  id: 5,
  surcharge: 20,
  surchargeType: 'FLAT',
  commissionType: 'PERCENTAGE',
  cashbackType: 'FLAT',
  providerCommission: 1,
  cashback: 1,
  serviceProvider: 'Traffic Challan',
  vendor,
};
const reportData = { journalData: { commissionIncludingGST: 59, commissionMode: 'MARGIN' } };

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
    reg_num: 'KL01AB1234',
    challans: [{ challan_number: 'CH-1', challan_price: 500, registration_number: 'KL01AB1234' }],
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
  getDroomToken.mockResolvedValue('token');
  pushOrder.mockResolvedValue({ status: true, data: { data: { reference_id: 'REF-1' } } });
  generateOrderInvoiceAttachments.mockResolvedValue([]);
  fleetChallanCache.update.mockResolvedValue();
  wallet.findOne.mockResolvedValue({ balance: 100 });
});

describe('a traffic challan paid from the wallet', () => {
  it('works out its journal on the fines, as a wallet payment', async () => {
    await payment(request({}), response(), jest.fn());

    expect(computeJournalData).toHaveBeenCalledTimes(1);
    expect(computeJournalData).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceDetails,
        amount: 500,
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

    const { corporateTxnId, amount } = createWalletTransaction.mock.calls[0][0];
    expect(amount).toBe(533.6);
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

  it('carries the commission and the fines into the invoice', async () => {
    await payment(request({}), response(), jest.fn());

    expect(updateWalletTransaction).toHaveBeenCalledTimes(1);
    expect(generateOrderInvoiceAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        vendor,
        commissionIncludingGST: 59,
        planDetails: [{ name: 'Traffic Challan CH-1', amount: 500, quantity: 1 }],
        commissionMode: 'MARGIN',
      })
    );
    const invoice = generateOrderInvoiceAttachments.mock.calls[0][0];
    expect(invoice).not.toHaveProperty('pgAmount');
    expect(invoice).not.toHaveProperty('paymentMethod');
  });

  it('reverses the journal when the provider cannot take the order', async () => {
    pushOrder.mockResolvedValue({ status: false, data: { message: 'rejected' } });

    await payment(request({}), response(), jest.fn());

    expect(refundWalletTransaction).toHaveBeenCalledTimes(1);
    expect(eventTypes()).toEqual(['payment', 'refund']);
    expect(publishJournalEvent.mock.invocationCallOrder[1]).toBeGreaterThan(
      refundWalletTransaction.mock.invocationCallOrder[0]
    );
    expect(publishJournalEvent.mock.calls[1][0].reportData).toBe(reportData);
    expect(generateOrderInvoiceAttachments).not.toHaveBeenCalled();
  });

  it('does not touch the journal when the wallet cannot pay', async () => {
    createWalletTransaction.mockResolvedValue({ error: 'INSUFFICIENT WALLET BALANCE' });
    const next = jest.fn();

    await payment(request({}), response(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).not.toHaveBeenCalled();
    expect(pushOrder).not.toHaveBeenCalled();
  });
});
